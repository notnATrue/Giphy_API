const name = document.querySelector("#name");
const pass = document.querySelector("#pass");

const name_ = document.querySelector("#name_");
const pass_ = document.querySelector("#pass_");

const result = document.querySelector("#result");

const signInButton = document.querySelector("#signin");
signInButton.addEventListener("click", function(event) {
  myFetch("/signin", name_.value, pass_.value);
});

const signButton = document.querySelector("#signup");
signButton.addEventListener("click", function(event) {
  myFetch("signup", name.value, pass.value);
});

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
    .then(data => (result.innerHTML = data))
    .catch(err => {
      if (err) throw err;
    });
}
