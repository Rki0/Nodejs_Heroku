# ✨ Back-end

이번에 처음으로 배포해본 모바일 웹에 대한 코드 리뷰를 진행하고자 한다.

[배포 관련 Github 보기](https://github.com/Rki0/RootingForYou_Deployed)  
[Front-end Gibhub 보기](https://github.com/Rki0/RootingForYou_Front/tree/master/client)

## 📂 파일 구조

<img width="163" alt="스크린샷 2022-07-19 오전 10 13 22" src="https://user-images.githubusercontent.com/86224851/179642721-6f84d6d7-4bb9-4dc8-9200-656f0e796a39.png">

파일 구조는 다음과 같다.  
각 폴더의 하위 항목들은 아래에서 자세하게 다룰 예정이다.  
필자는 Front와 Back을 나눠서 개발했기 때문에 최상위 폴더는 만들지 않았다.(보통 server라는 이름으로 많이들 만드시는 것 같다)  
이미, [Node.js 기초 공부 Github 링크](https://github.com/Rki0/Nodejs_Study_Base/tree/main/server)에서 공부한 내용을 활용하였기 때문에, 새롭게 추가한 부분에 대해서만 언급을 하고자한다.

## 🗂 models/Posting.js

User 모델을 활용하는 것은 기초 공부 때 설명을 다 해버렸기 때문에,  
여기서는 필자가 새롭게 만든 기능인 게시물 관련 라우터에 대해서 설명하고자 한다.  
게시물 관련 정보를 저장하기 위해서 Post라는 모델을 새롭게 만들었다.

```js
const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 10,
  },
  email: {
    type: String,
    trim: true,
  },
  userId: {
    type: String,
  },
  post: {
    type: Object,
    title: "",
    text: "",
    time: "",
  },
});

const Post = mongoose.model("Post", postSchema);

module.exports = { Post };
```

필자는 DB에서 유저 정보와 게시물 정보를 따로 관리했다.  
어떤 유저에게든 전체 게시물을 보여줘야하는 기능을 만들고 싶기도 했고, 특정 유저의 게시물들을 검색하는 기능도 문제없이 만들 수 있었기 때문이다.  
그래서, 위 코드에서 스키마(Schema)를 보면 유저의 name, email, userId를 post와 함께 저장하는 것을 볼 수 있다.  
유저 정보는 post가 어떤 유저에 의해서 생선된 건지 판단하는 지표가 된다.  
이전 User 모델에서는 email에 unique라는 속성을 부여해서, 같은 이메일로 중복 가입이 안되게 막았었다.  
하지만 게시물은 한 명의 유저가 계속해서 만들어낼 수 있기 때문에, unique 설정을 해놓으면 DB에서 에러가 발생한다.(11000 Error)  
이 부분을 고려해서 unique 속성을 삭제했다.  
또한, 생성된 데이터에 대하여 DB가 자체적으로 부여하는 id가 있는데,

<img width="299" alt="스크린샷 2022-07-19 오전 10 28 45" src="https://user-images.githubusercontent.com/86224851/179644376-1868dd86-a96c-4b52-a062-4f7abafbd897.png">

\_id 라는 형태로 입력이 된다. 필자는 userId를 id라는 key로 사용하려고 했다가, 가끔씩 뭐가 내가 사용하려던 id였는지 헷갈릴 때가 있었다.  
그래서 User 모델에서 가져오는 \_id는 userId라고 이름을 변경해서 저장했다.

## 🗂 index.js

게시물 관련 라우터 중 가장 기본이 되는 게시물 등록 라우터에 대해서 설명하고자 한다.  
필자는 유저 관련 라우터와 게시물 관련 라우터를 전부 index.js에 작성했는데, 코드 이해에 방해가 될 수도 있을 것 같아서, 다음부터는 라우터 기능 별로 나눠서 작성하려고 생각 중이다.  
이제 코드를 살펴보자. 게시물 "등록"이기 때문에 DB에 데이터를 "보내는" 행위를 한다.

```js
const { Post } = require("./models/Posting");

app.post("/api/users/posting", (req, res) => {
  const posting = new Post({
    name: req.body.name,
    email: req.body.email,
    userId: req.body.userId,
    post: { title: req.body.title, text: req.body.text, time: req.body.time },
  });

  posting.save((err, doc) => {
    if (err) return res.json({ addPostsuccess: false, err });

    return res.status(200).json({
      addPostsuccess: true,
    });
  });
});
```

따라서, post 메서드를 사용했다.(메서드는 라우터마다 적절하게 사용해줘야하므로 연습하면서 이해해보자!)  
바로 위에서 설명했던 Post 모델에 필요한 정보들을 설정해놨는데, 이 정보들은 client 쪽에서 api 통신으로 가져오는 것이다.  
posting이라는 변수에 정보를 저장하고, 이를 DB에 save를 해준다.  
err가 발생했을 때와 성공했을 때를 나눠서 처리해줬고, 성공 여부는 status가 200일 때로 간주한다.  
여기서 return되는 json 코드는 client에서 통신을 요청했던 곳으로 돌아가는 것이다.

## 🗂 config/key.js

배포까지 고려하고 있는 프로젝트라면, 본인이 사용하는 DB나 각종 환경 변수에 대해 보안성을 생각해봐야한다.  
DB의 id나 password를 그대로 올려버리면 해킹의 위험이 있기 때문이다.

```js
if (process.env.NODE_ENV === "production") {
  module.exports = require("./prod");
} else {
  module.exports = require("./dev");
}
```

process.env는 환경 변수를 사용하기 위한 것이다.  
NODE_ENV는 development 모드와 production 모드가 있다.  
말 그대로, 전자는 개발할 때, 후자는 배포할 때를 의미한다.  
보통 개발 모드 일 때 사용하는 파일들은 .gitignore에 넣어줘서 배포할 때, 코드가 타인에게 보이지 않도록 처리해준다.  
prod 파일에서는 배포되는 곳에서 환경 변수를 받아올 수 있도록 해당 배포 사이트 설정에서 처리해주면 된다.  
필자는 Heroku로 배포를 했는데, Heroku에서는 배포시 자동으로 process.env.NODE_ENV가 production으로 전환된다고 한다.

## 🗂 config/prod.js

방금 말한 prod 모드에서의 환경 변수를 받아오기 위해서 아래와 같이 코드를 작성한다.

```js
module.exports = {
  mongoURI: process.env.MONGO_URI,
};
```

필자는 DB 관련 환경 변수 외에는 다른게 없었으므로, 하나만 설정해놨지만 본인이 여러 개의 환경 변수가 필요하다면 추가해서 작성하면 된다.  
process.env 뒤에 붙는 것은 본인이 배포 사이트에서 설정한 것과 동일하게 설정해줘야한다.(Heroku 뿐만이 아니라, 다른 곳도 같은 것이라고 생각된다)

이상으로 Back-end 코드 리뷰를 마치겠습니다.  
사실, 겹치는 코드들은 Node.js 기초 공부 할 때, 이미 주석으로 다 설명을 해놔서 길게 설명할 것이 없었습니다..  
모두들 재밌는 코딩하세요~🥳
