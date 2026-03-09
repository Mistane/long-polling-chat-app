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
  const listGroup = chatContainer.querySelector(".list-group");
  if (!localStorage.getItem("infoUser"))
    window.location.href = "/user/login.html";

  const { UID, username } = infoUser;
  fetch("/users", {
    method: "GET",
    headers: { "Content-Type": "application/json", UID, getRoom: true },
  })
    .then((res) => res.json())
    .then((data) => {
      const html = data.users
        .map((user) => {
          return `<div class="user" uid=${user.UID}>${user.username} </div>`;
        })
        .join("");

      const htmlGroup = data.rooms
        .map((room) => {
          return `<div class="group" roomId=${room.roomId}>${room.groupName} </div>`;
        })
        .join("");
      const div = document.createElement("div");
      div.innerHTML = htmlGroup;
      listGroup.appendChild(div);
      const groupsList = document.querySelectorAll(".group");

      groupsList.forEach((group) => {
        group.addEventListener("click", async (e) => {
          const roomId = group.getAttribute("roomid");
          const res = await fetch("/chat", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              roomId,
            },
          });
          const url = new URL(location);
          url.searchParams.set("roomId", roomId);
          history.pushState({}, "", url);
          const chatContainer = document.querySelector(".chat-container");
          chatContainer.setAttribute("roomId", roomId);

          let messages = await res.json();
          if (messages.length !== 0) {
            messages = messages.split("///");
            messages.forEach((message) => {
              const [uid, content] = message.split("-");
              let tmpHTML = document.createElement("div");
              tmpHTML.classList.add("message");
              if (UID == uid) {
                tmpHTML.classList.add("sent");
              } else tmpHTML.classList.add("received");
              tmpHTML.innerText = content;
              messageList.append(tmpHTML);
            });
          }
        });
      });

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

          //insert query so that when reloading the page remain the same
          const url = new URL(location);
          url.searchParams.set("roomId", roomId);
          history.pushState({}, "", url);

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
          if (messages.length !== 0) {
            console.log("Ok co tin nhan ha");
            messages = messages.split("///");
            messages.forEach((message) => {
              if (message !== null) {
                const [uid, content] = message.split("-");
                if (content !== "") {
                  console.log("message la : ", message);
                  let tmpHTML = document.createElement("div");
                  tmpHTML.classList.add("message");
                  if (UID == uid) {
                    tmpHTML.classList.add("sent");
                  } else tmpHTML.classList.add("received");
                  tmpHTML.innerText = content;
                  messageList.append(tmpHTML);
                }
              }
            });
          }
        });
      });
    });
  getMessage();
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
        },
      });
      if (res.status === 502) {
        await getMessage();
      } else if (res.status !== 200) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await getMessage();
      } else {
        const { message, UID, roomId } = await res.json();
        console.log("message tra ve : ", message);
        const rooms = document.querySelectorAll("[roomid]");
        rooms.forEach((room) => {
          if (room.getAttribute("roomid") != roomId) {
            room.style.border = "red";
          }
        });
        if (message !== null) {
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

//--------------create a new group chat ----------------------------
const createGroupBtn = document.querySelector(".create-group-btn");
if (createGroupBtn) {
  const infoUser = JSON.parse(localStorage.getItem("infoUser"));
  if (!localStorage.getItem("infoUser"))
    window.location.href = "/user/login.html";
  createGroupBtn.addEventListener("click", async (e) => {
    const createPane = document.querySelector(".users-pane");
    const createGroupForm = document.querySelector("[create-group-form]");
    createGroupForm.addEventListener("submit", (e) => e.preventDefault());
    const groupNameField = document.querySelector("#group-name");
    createPane.style.display = "block";

    const res = await fetch("/users", {
      method: "GET",
      headers: { "Content-Type": "application/json", UID: infoUser.UID },
    });
    const data = await res.json();
    const div = document.createElement("div");
    const users = data.users;
    console.log(data);
    div.innerHTML = users
      .map((user) => {
        return `<div class="select-user-pane">
            <input UID=${user.UID} type="checkbox" class="checkbox"/>
            <div class="user-checkbox">${user.username}</div>
          </div>
		`;
      })
      .join("");
    createPane.insertBefore(div, createGroupForm);
    const exitBtn = createPane.querySelector(".exit-create-pane");
    exitBtn.addEventListener("click", (e) => {
      createPane.style.display = "none";
      div.parentNode.removeChild(div);
    });

    let uidString = `${infoUser.UID}-`;
    const checkboxes = document.querySelectorAll(".checkbox");
    checkboxes.forEach((box) => {
      box.addEventListener("click", (e) => {
        const uid = box.getAttribute("uid");
        if (uidString.includes(uid)) {
          let idx = uidString.indexOf(uid);
          if (idx == 0) uidString = uidString.substring(2, uidString.length);
          else {
            uidString =
              uidString.substring(0, idx) +
              uidString.substring(idx + 1, uidString.length - 1);
          }
        } else uidString += `${uid}-`;
        console.log(uidString);
      });
    });

    const createBtn = document.querySelector("button[create-group-btn]");
    createBtn.addEventListener("click", async (e) => {
      const groupName = groupNameField.value;
      if (uidString !== "" && groupName !== "") {
        uidString = uidString.slice(0, uidString.length - 1);
        const res = await fetch("/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json", UID: infoUser.UID },
          body: JSON.stringify({ uidString, groupName }),
        });
        const data = await res.json();
        console.log(uidString);
      }
    });
  });
}
