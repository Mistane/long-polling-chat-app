// --------------handle login logic -----------------------------
const loginForm = document.querySelector("[login-form]");
if (loginForm) {
  const usernameField = loginForm.querySelector("input[type='text']");
  const passwordField = loginForm.querySelector("input[type='password']");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (usernameField.value !== "" && passwordField.value !== "") {
      const res = await fetch("/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usernameField.value,
          password: passwordField.value,
        }),
      });
      const data = await res.json();
      usernameField.value = "";
      passwordField.value = "";
      console.log(data);
      if (res.status === 401) {
        console.log("vo day");
        alert(data.msg);
      } else {
        const { UID, username } = data;
        localStorage.setItem("infoUser", JSON.stringify({ UID, username }));
        window.location.href = "/chat.html";
        console.log(data.msg);
      }
    }
  });
}
// ---------------------- end login logic ------------------------------

// --------------handle register logic -----------------------------
const registerForm = document.querySelector("[register-form]");
if (registerForm) {
  const usernameField = registerForm.querySelector("input[type='text']");
  const passwordField = registerForm.querySelector("input[type='password']");
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (usernameField.value !== "" && passwordField.value !== "") {
      const res = await fetch("/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usernameField.value,
          password: passwordField.value,
        }),
      });
      const data = await res.json();
      console.log(data);
    }
  });
}
// ------------------------- end register logic -----------------------------

// ----------------- handle send message -------------------------------
const sendBtn = document.querySelector(".send-btn");
if (sendBtn) {
  //If not login, force to login lol
  if (!localStorage.getItem("infoUser"))
    window.location.href = "/user/login.html";
  const infoUser = JSON.parse(localStorage.getItem("infoUser"));

  const parentElement = sendBtn.closest(".chat-input");
  const messageField = parentElement.querySelector("input");
  sendBtn.addEventListener("click", async (e) => {
    const chatContainer = sendBtn.closest(".chat-container");
    console.log(chatContainer.getAttribute("roomid"));
    const message = messageField.value;
    if (message !== "") {
      const res = await fetch("/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          UID: infoUser.UID,
          roomId: chatContainer.getAttribute("roomid"),
          timestamp: Date.now(),
        }),
      });
      const data = await res.json();
      console.log(data);
      messageField.value = "";
    }
  });
}
// ------------------end send message ---------------------------------
//
//------------------- get all users -----------------------------------
const chatContainer = document.querySelector(".chat-container");
if (chatContainer) {
  //If not login, force to login lol
  const infoUser = JSON.parse(localStorage.getItem("infoUser"));
  const usersContainer = chatContainer.querySelector(".users");
  const buttonCreateGroup = chatContainer.querySelector(".create-group-btn");
  if (!localStorage.getItem("infoUser"))
    window.location.href = "/user/login.html";

  const { UID, username } = infoUser;
  fetch("/users", {
    method: "GET",
    headers: { "Content-Type": "application/json", UID },
  })
    .then((res) => res.json())
    .then((users) => {
      const html = users
        .map((user) => {
          return `<button class="user" uid=${user.UID}>${user.username} </button>`;
        })
        .join("");

      const messageList = chatContainer.querySelector(".chat-messages");
      const usersListContainer = document.createElement("div");
      usersListContainer.classList.add("users-list");
      usersListContainer.innerHTML = html;
      usersContainer.insertBefore(usersListContainer, buttonCreateGroup);
      const usersList = chatContainer.querySelectorAll(".user");
      usersList.forEach((user) => {
        user.addEventListener("click", async (e) => {
          messageList.innerHTML = "";
          const uid = user.getAttribute("uid");
          let res;
          res = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              IDList: [UID, uid],
            }),
          });
          let roomId = await res.json();
          console.log(roomId);

          res = await fetch("/chat", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              roomId,
            },
          });

          let messages = await res.json();
          const chatContainer = document.querySelector(".chat-container");
          chatContainer.setAttribute("roomId", roomId);
          messages = messages.split("///");
          let messagesHTML = "";
          messages.forEach((message) => {
            const [uid, content] = message.split("-");
            let tmpHTML = document.createElement("div");
            tmpHTML.classList.add("message");
            if (UID == uid) {
              tmpHTML.classList.add("sent");
            } else tmpHTML.classList.add("received");
            tmpHTML.innerText = content;
            console.log(tmpHTML);
            messageList.append(tmpHTML);
          });
          getMessage();
        });
      });
    });
}
//-----------------------------retrieve latest message--------------
function getMessage() {
  const chatMessages = document.querySelector(".chat-messages");
  if (chatMessages) {
    //If not login, force to login lol
    const infoUser = JSON.parse(localStorage.getItem("infoUser"));
    if (!localStorage.getItem("infoUser"))
      window.location.href = "/user/login.html";
    let res = "";
    let roomId = document
      .querySelector(".chat-container")
      .getAttribute("roomid");
    const getMessage = async () => {
      res = await fetch("/messages", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          UID: infoUser.UID,
          roomId,
        },
      });
      if (res.status === 502) {
        await getMessage();
      } else if (res.status !== 200) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await getMessage();
      } else {
        const { message, UID } = await res.json();
        if (message !== " ") {
          let tmpHTML = document.createElement("div");
          tmpHTML.classList.add("message");
          if (UID == infoUser.UID) {
            tmpHTML.classList.add("sent");
          } else tmpHTML.classList.add("received");
          tmpHTML.innerText = message;
          chatMessages.append(tmpHTML);
        }

        await getMessage();
      }
      // fetch("/messages")
      //   .then((res) => res.json())
      //   .then((data) => {
      //     message = data;
      //     console.log(message);
      //   })
      //   .catch((err) => {
      //     getMessage();
      //   });
    };

    getMessage();
  }
}
