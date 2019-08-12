
let name = document.querySelector('#name');
let pass = document.querySelector('#pass');

let name_ = document.querySelector('#name_');
let pass_ = document.querySelector('#pass_');

let signInButton = document.querySelector('#signin');
    signInButton.addEventListener('click', function(event) {
        myFetch('/signin', name_.value, pass_.value)
    })


let signButton = document.querySelector('#signup');
    signButton.addEventListener('click', function(event) {
        myFetch('signup', name.value, pass.value)
    });

function myFetch(url, name, pass) {
    return fetch(url, {
        method:'POST',
        body: JSON.stringify({
            "name": name,
            "pass": pass
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.text())
    .then(data => console.log(data))
    .catch(err => {if (err) throw err});
};