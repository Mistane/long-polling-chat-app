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
      console.log(data);
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
  const parentElement = sendBtn.closest(".chat-input");
  const messageField = parentElement.querySelector("input");
  sendBtn.addEventListener("click", async (e) => {
    const message = messageField.value;
    if (message !== "") {
      const res = await fetch("/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          UID: 2,
          roomID: "f1",
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
//-----------------------------retrieve latest message--------------
let message = "";
let res = "";
const getMessage = async () => {
  res = await fetch("/messages", {
    method: "GET",
    headers: { "Content-Type": "application/json", UID: 2, roomId: "f1" },
  });
  if (res.status === 502) {
    await getMessage();
  } else if (res.status !== 200) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await getMessage();
  } else {
    message = await res.json();
    console.log(message);

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

await getMessage();
