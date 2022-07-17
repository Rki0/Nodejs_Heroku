// 유저 게시물 모델 생성

const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 10,
  },
  email: {
    type: String,
    trim: true,
    // 회원가입, 로그인, 인증 시에는 unique하게 만드는게 맞지만
    // 게시물 저장할 때는 mongoDB 11000 에러가 발생한다. 이는 키가 중복된다는 것으로, 같은 email로는 하나 이상의 게시물을 저장할 수 없게된다.
    // name, email을 통해 구분하고자 했던 내 의도에 방해가 되므로, unique 속성을 제거
    // unique: 1,
  },
  // key 이름을 _id로 설정해버리면 DB에서 자체 할당되는 게시물 고유 _id와 유저 _id가 헷갈림..
  // key 이름을 바꿔서 확실하게 구분하자.
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
