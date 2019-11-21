const config = require("./config");

const fs = require("fs");

var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");

firebase.initializeApp(config.firebase);

const db = firebase.firestore();

var uid = null;

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    uid = user.uid;
  } else {
  }
});

const login = IO => {
  firebase
    .auth()
    .signInAnonymously()
    .catch(error => {
      console.log(error.code);
      console.log(error.message);
    });

  IO.say("ログインしました");
};

const postMessage = IO => {
  if (!uid) {
    IO.say("ログインしてください");
    return;
  }
  const date = new Date();
  const now = date.getTime();

  console.log("録音を開始します。");
  console.log("ボタンを押してください。");

  IO.closeEvent();

  IO.recordSaying((_, fileName) => {
    const sound = fs.readFileSync(fileName, "base64");

    db.collection("users")
      .doc(uid)
      .collection("posts")
      .doc(`${now}`)
      .set({
        sound: sound,
        time: now
      });

    IO.say("投稿しました");

    IO.closeEvent();

    IO.restart();
  });
};

const acquirePosts = async IO => {
  if (!uid) {
    IO.say("ログインしてください");
    return;
  }

  const snapshots = await db
    .collectionGroup("posts")
    .orderBy("time", "desc")
    .limit(10)
    .get();

  var posts = [];

  snapshots.forEach(doc => {
    posts.push({
      id: doc.id,
      sound: doc.data().sound
    });
  });

  IO.say(`新着の投稿を${posts.length}個、再生します。`);

  const rootine = () => {
    post = posts.pop();
    if (!post) {
      return;
    }

    IO.say(post.id);

    const decode = Buffer.from(post.sound, "base64");

    IO.playSound(decode, rootine);
  };

  rootine();
};

module.exports = {
  login: login,
  postMessage: postMessage,
  acquirePosts: acquirePosts
};

// io = {
//   say: console.log
// };

// login(io);

// setTimeout(() => {
//   acquirePosts(io);
// }, 3000);
