var apiKey = "a119392d2c44e5f3b270f5ade5ac221d";
var apiRAT = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMTE5MzkyZDJjNDRlNWYzYjI3MGY1YWRlNWFjMjIxZCIsInN1YiI6IjY0ZmFkYWM2ZmZjOWRlMDEzOGViYWZhZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.CXi3K75a6AwYUhEm8yG_QtO2colywujc7Mi3MymUozw"

const form = document.getElementById('movie-search-form');
const searchInput = document.getElementById('search-input');

//search for movies
form.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission
    const searchTerm = searchInput.value.trim();

    const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMTE5MzkyZDJjNDRlNWYzYjI3MGY1YWRlNWFjMjIxZCIsInN1YiI6IjY0ZmFkYWM2ZmZjOWRlMDEzOGViYWZhZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.CXi3K75a6AwYUhEm8yG_QtO2colywujc7Mi3MymUozw'
        }
      };
    if (searchTerm !== '') {
        const apiEndpoint = `https://api.themoviedb.org/3/search/movie?query=${searchTerm}&include_adult=false&language=en-US&page=1&region=us`;

        fetch(apiEndpoint, options)
            .then(response => response.json())
            .then(data => {
                // Handle the API response data here
                const searchResults = data;
                //window.location.href = `/search-results.html?results=${searchResults}`;
                console.log(searchResults);
                $("#hero").hide();
                $("#search-results-section").show();
                var numofResults = searchResults.results.length;
                $(".search-result").each(function(i){
                    if(i < numofResults){
                        var h3 = $(this).find("h3");
                        var p = $(this).find("p");
                        var img = $(this).find("img");
                        var new_image = "https://www.themoviedb.org/t/p/w600_and_h900_bestv2/" + searchResults.results[i].poster_path;
                    

                        h3.text(searchResults.results[i].title);
                        p.text(searchResults.results[i].overview);
                        img.attr("src", new_image);
                        img.attr("width", 200);
                        img.attr("height",300);
                    }
                    else{
                        $(this).hide();
                        $("#load-more").hide();
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }
});
