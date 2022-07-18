const express = require("express");

const app = express();

const port = process.env.PORT || 8000;

const cors = require("cors");

// dev
// app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// prod
app.use(
  cors({ origin: "https://rootingforyou.netlify.app", credentials: true })
);

app.get("/", (req, res) => {
  res.send(`Hello World!~~안녕하세요~~Heroku~${port}`);
  // res.send(
  //   `Hello World!~~안녕하세요~~Heroku~${process.env.NODE_ENV}~${process.env.MONGO_URI}~`
  // );
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

//////// mongoDB URI값 가져오기 ////////
const config = require("./config/key");
////////////////

//////// mongoose로 내 애플리케이션과 연결하기 ////////
const mongoose = require("mongoose");

mongoose
  .connect(config.mongoURI)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log("Error", err));
////////////////

//////// User 모델 가져오기 ////////
const { User } = require("./models/User");
////////////////

//////// body-parser ////////
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
////////////////

//////// 회원가입 라우터 ////////
app.post("/api/users/register", (req, res) => {
  const user = new User(req.body);

  user.save((err, doc) => {
    if (err) return res.json({ success: false, err });

    return res.status(200).json({
      success: true,
    });
  });
});
////////////////

//////// 로그인 라우터 ////////
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.post("/api/users/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "제공된 이메일에 해당하는 유저가 없습니다.",
      });
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch) {
        return res.json({
          loginSuccess: false,
          message: "비밀번호가 틀렸습니다.",
        });
      }

      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);

        res
          .cookie("x_auth", user.token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
          })
          .status(200)
          .json({ loginSuccess: true, userId: user._id });
      });
    });
  });
});
////////////////

//////// 인증 라우터 ////////
const { auth } = require("./middleware/auth");

app.get("/api/users/auth", auth, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    post: req.user.post,
  });
});
////////////////

//////// 로그아웃 라우터 ////////
app.get("/api/users/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, user) => {
    if (err) return res.json({ logoutSuccess: false, err });

    // return res.status(200).send({ logoutSuccess: true });
    return res.status(200).json({ logoutSuccess: true });
  });
});
////////////////

//////// 비밀번호 변경 라우터 ////////
app.post("/api/users/changepassword", (req, res) => {
  // 현재 로그인된 유저의 email을 받아와서 비밀번호를 비교할 것임
  User.findOne({ email: req.body.email }, (err, user) => {
    // 입력한 비밀번호와 현재 유저 비밀번호가 일치하는지 확인
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch) {
        return res.json({
          passwordCheckSuccess: false,
          message: "비밀번호가 틀렸습니다.",
        });
      }

      // 현재 비밀번호를 맞췄다면, 새로운 비밀번호로 교체
      User.findById({ _id: req.body.userId }, (err, user) => {
        if (err) return res.json({ findAndUpdateSuccess: false, err });

        user.password = req.body.changePassword;

        user.save((err, doc) => {
          if (err) return res.json({ changePasswordSuccess: false, err });

          return res.status(200).json({
            changePasswordSuccess: true,
          });
        });
      });
    });
  });
});
////////////////

//////// 회원 탈퇴 라우터 ////////
// 이메일은 중복될 수도 있으므로(unique 설정을 하긴 했는데, 조금 불안해서 ㅎㅎ..이건 실험해 봐야겠다)
// 실험해봤더니 unique가 제대로 작동해서, 같은 이메일로 중복 가입은 안됨!
// _id값을 받아와서 일치하는 경우에 remove하는 것으로 해야할듯?
app.post("/api/users/withdrawal", (req, res) => {
  User.deleteOne({ _id: req.body.userId }, (err) => {
    if (err) return res.json({ deleteUserSuccess: false, err });

    return res.status(200).json({
      deleteUserSuccess: true,
    });
  });
});
////////////////

//////// 게시물 등록 라우터 ////////
// 게시물을 작성할 수 있는 단계까지 왔으면 인증 절차가 이미 다 완료된 것이므로, 게시물 데이터만 유저 정보에 보내주면 됨
const { Post } = require("./models/Posting");

app.post("/api/users/posting", (req, res) => {
  const posting = new Post({
    name: req.body.name,
    email: req.body.email,
    userId: req.body.userId,
    post: { title: req.body.title, text: req.body.text, time: req.body.time },
  });

  // DB에 저장하는 것
  posting.save((err, doc) => {
    if (err) return res.json({ addPostsuccess: false, err });

    // client에 res가 전달되는 것
    // 여기에 작성된 json이 리덕스 스토어에 저장되는 것이긴 한데
    // 여러번 게시물 작성을 해본 결과, 덮어쓰기가 되버림.
    // 따라서, DB에 보내는 것으로만 하고, 성공 여부만 client에 보여준 뒤
    // 게시물을 보는 것은 게시물 출력 라우터에서 해결하자
    return res.status(200).json({
      addPostsuccess: true,
    });
  });
});
////////////////

//////// 전체 게시물 출력 라우터 ////////
// 인증 라우터와 비슷하다고 생각함. 로그인 정보를 json 형식으로 res에 보내주기 때문에 리덕스 스토어에 저장할 수 있게 해줌
// 미들웨어까지는 필요 없을 것으로 생각. 게시물을 email 비교를 통해 보여주거나(마이페이지), 단순 나열하는 것(랜딩페이지)이 목표라서.
app.get("/api/users/loadpost", (req, res) => {
  // DB에서 "모든 게시물을 가져오는 것"과 "특정 사용자의 게시물만 가져오는 것"을 따로 구현해야함. app.get 부분에서부터..
  // 우선 동작을 확인하기 위해서 전자를 구현해보자.
  // 로그인 라우터에서 findOne 하는 것처럼! <-- 이건 후자에 해당
  Post.find({}, (err, post) => {
    res.status(200).json({
      loadSuccess: true,
      wholePost: post,
    });
  });
});
////////////////

//////// 내 게시물 출력 라우터 ////////
// 로그인 라우터와 유사. email 정보를 주고, 일치하는 게시물만 가져오도록 하자.
app.post("/api/users/loadmypost", (req, res) => {
  Post.find({ email: req.body.email }, (err, post) => {
    res.status(200).json({
      loadSuccess: true,
      myPost: post,
    });
  });
});
////////////////

//////// 특정 유저 게시물 검색 및 출력 라우터 ////////
// 로그인 라우터와 유사. email 정보를 주고, 일치하는 게시물만 가져오도록 하자.
app.post("/api/users/searchpost", (req, res) => {
  Post.find({ name: req.body.name }, (err, post) => {
    if (err) return res.json({ searchSuccess: false, err });

    res.status(200).json({
      searchSuccess: true,
      thisUserPost: post,
    });
  });
});
////////////////

//////// 특정 게시물 상세보기 라우터 ////////
// 게시물의 _id를 통해 그 게시물만 볼 수 있는 페이지에 정보 전달
app.post("/api/users/showdetail", (req, res) => {
  Post.findOne({ _id: req.body.postId }, (err, post) => {
    if (err) return res.json({ showDetailSuccess: false, err });

    res.status(200).json({
      showDetailSuccess: true,
      detailedPost: post,
    });
  });
});
////////////////

//////// 내 게시물 삭제 라우터 ////////
// 게시물마다 고유 _id가 있으므로 그 것만 찾아서 삭제
app.post("/api/users/deletemypost", (req, res) => {
  Post.deleteOne({ _id: req.body._id }, (err, post) => {
    res.status(200).json({
      deleteSuccess: true,
    });
  });
});
////////////////

//////// 회원 탈퇴 시 해당 유저 게시물 전부 삭제 라우터 ////////
// 게시물 정보에 들어있는 해당 유저의 _id와 일치하는 것들을 전부 삭제
app.post("/api/users/deleteuserwholepost", (req, res) => {
  Post.deleteMany({ userId: req.body.userId }, (err, post) => {
    if (err) return res.json({ deleteWholeSuccess: false, err });

    res.status(200).json({
      deleteWholeSuccess: true,
    });
  });
});
////////////////
