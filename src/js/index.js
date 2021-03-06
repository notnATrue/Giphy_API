const nameUp = document.querySelector("#name");
const passUp = document.querySelector("#pass");

const nameIn = document.querySelector("#name_");
const passIn = document.querySelector("#pass_");

const result = document.querySelector("#result");

function myFetch(url, name, pass) {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify({
      name,
      pass
    }),
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(res => res.text())
    .then(data => {
      result.innerHTML = data;
    })
    .catch(err => {
      if (err) throw err;
    });
}

const signInButton = document.querySelector("#signin");
signInButton.addEventListener("click", function() {
  myFetch("/signin", nameIn.value, passIn.value);
});

const signButton = document.querySelector("#signup");
signButton.addEventListener("click", function() {
  myFetch("signup", nameUp.value, passUp.value);
});
