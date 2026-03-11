let unreadRooms = {
  group: [],
  friend: [],
};

async function getUnreadRooms() {
  const infoUser = JSON.parse(localStorage.getItem("infoUser"));
  if (!infoUser) {
    await getUnreadRooms();
  } else {
    const UID = infoUser.UID;
    const res = await fetch("/messages/unread", {
      method: "GET",
      headers: { "Content-Type": "application/json", UID },
    });

    const data = await res.json();
    console.log(data);
    unreadRooms = data;
  }
}

function scrollToBottom(){
    const chatMessages = document.querySelector(".chat-messages")
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

if(window.location.href.indexOf("chat.html") !== -1){
    getUnreadRooms();
}
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
  console.log("Unread room hien tai : ", unreadRooms);
  // await getUnreadRooms(UID);
  fetch("/users", {
    method: "GET",
    headers: { "Content-Type": "application/json", UID, getRoom: true },
  })
    .then((res) => res.json())
    .then((data) => {
      const html = data.users
        .map((user) => {
          let classList = "user";
          let UID = `${user.UID}`;
          if (unreadRooms.friend.indexOf(UID) !== -1) {
            classList += " unread";
          }
          return `<div class="${classList}" uid=${user.UID}>${user.username} </div>`;
        })
        .join("");

      const htmlGroup = data.rooms
        .map((room) => {
          let classList = "group";
	    let roomId = `${room.roomId}`
	    if(unreadRooms.group.indexOf(roomId) !== -1){
		    classList += " unread"
		}
          return `<div class="${classList}" roomId=${room.roomId}>${room.groupName} </div>`;
        })
        .join("");
      const div = document.createElement("div");
      div.innerHTML = htmlGroup;
      listGroup.appendChild(div);

      // //Mark as unread
      // unreadRooms.friend.forEach((uid) => {
      //   let room = document.querySelector(`[uid=${uid}]`);
      //   console.log(room);
      //   room.classList.add("unread");
      // });
      // unreadRooms.group.forEach((roomId) => {
      //   let room = document.querySelector(`[roomid=${roomId}]`);
      //   room.classList.add("unread");
      // });
      // //---------------------------
      const groupsList = document.querySelectorAll(".group");

      groupsList.forEach((group) => {
        group.addEventListener("click", async (e) => {
          if (group.classList.contains("unread")) {
            //remove groupId from unread room
            const groupId = group.getAttribute("roomid");
            group.classList.remove("unread");
            let idx = unreadRooms.group.indexOf(`${groupId}`);
            console.log(unreadRooms.group);
            if (idx !== -1) {
              unreadRooms.group.splice(idx, 1);
            }
          }
          const roomId = group.getAttribute("roomid");
          const res = await fetch("/chat", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              roomId,
            },
          });
          const chatContainer = document.querySelector(".chat-container");
          const messageList = chatContainer.querySelector(".chat-messages");
          messageList.innerHTML = "";
          const url = new URL(location);
          url.searchParams.set("roomId", roomId);
          history.pushState({}, "", url);
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
		    scrollToBottom();
              console.log("Nhoc nhanh hon anh khong 2");
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
        const uid = user.getAttribute("uid");
        user.addEventListener("click", async (e) => {
          messageList.innerHTML = "";
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
          if (user.classList.contains("unread")) {
            //remove roomId from unread room
            user.classList.remove("unread");
            let idx = unreadRooms.friend.indexOf(`${uid}`);
            if (idx !== -1) {
			    console.log("idx la ", idx)
              unreadRooms.friend.splice(idx, 1);
              // console.log(unreadRooms.friend.splice(idx, 1))
            }
            console.log(unreadRooms.friend);
          }

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
                  let tmpHTML = document.createElement("div");
                  tmpHTML.classList.add("message");
                  if (UID == uid) {
                    tmpHTML.classList.add("sent");
                  } else tmpHTML.classList.add("received");
                  tmpHTML.innerText = content;
                  messageList.append(tmpHTML);
		    scrollToBottom();
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
        const data = await res.json();
        const { message, UID, roomId } = data;
        if (message !== null) {
          let currentRoomId = document
            .querySelector(".chat-container")
            .getAttribute("roomid");
          const roomChatList = document.querySelectorAll("[uid]");
          const groupChatList = document.querySelectorAll("[roomid]");
          if (roomId.charAt(0) === "f") {
            console.log("Nay la ban gui den");
            roomChatList.forEach((room) => {
              const uid = room.getAttribute("uid");
              if (uid == UID && currentRoomId != roomId) {
                unreadRooms.friend.push(UID);
                room.classList.add("unread");
              }
            });
          } else {
            console.log("Nay la group gui den");
            groupChatList.forEach((group) => {
              const groupId = group.getAttribute("roomid");
              if (groupId == roomId && currentRoomId != roomId) {
                unreadRooms.group.push(`${groupId}`);
                group.classList.add("unread");
              }
            });
          }

          if (currentRoomId == roomId) {
            let tmpHTML = document.createElement("div");
            tmpHTML.classList.add("message");
            if (UID == infoUser.UID) {
              tmpHTML.classList.add("sent");
            } else tmpHTML.classList.add("received");
            tmpHTML.innerText = message;
            chatMessages.append(tmpHTML);
		    scrollToBottom();
          }
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

async function renderRoomMessages() {
  const queryString = window.location.search;

  const urlParams = new URLSearchParams(queryString);
  const roomId = urlParams.get("roomId");
  if (roomId) {
    const { UID } = JSON.parse(localStorage.getItem("infoUser"));
    console.log("UID la : ", UID);

    const res = await fetch("/chat", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        roomId,
      },
    });

    const chatContainer = document.querySelector(".chat-container");
    const messageList = chatContainer.querySelector(".chat-messages");
    let messages = await res.json();
    messageList.innerHTML = "";
    chatContainer.setAttribute("roomId", roomId);
    if (messages.length !== 0) {
      messages = messages.split("///");
      messages.forEach((message) => {
        if (message !== null) {
          const [uid, content] = message.split("-");
          if (content !== "") {
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
  }
}

renderRoomMessages();

window.addEventListener("beforeunload", async (e) => {
  const { UID } = JSON.parse(localStorage.getItem("infoUser"));
  if (UID) {
    navigator.sendBeacon(
      "/messages/unread",
      JSON.stringify({ UID, unreadRooms }),
    );
  }
});
