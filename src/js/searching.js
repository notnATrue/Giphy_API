const searchValue = document.querySelector("#search_value");

function searchFetch(value_) {
  return fetch("/search", {
    method: "POST",
    body: JSON.stringify({
      toSearch: value_
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

const searchButton = document.querySelector("#search");
searchButton.addEventListener("click", function(event) {
  searchFetch(searchValue.value);
});


