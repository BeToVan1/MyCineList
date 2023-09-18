const form = document.getElementById('movie-search-form');
const searchInput = document.getElementById('search-input');

var searchData;
var loaded = false;
//search for movies and load initial 5
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
                searchData = data;
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
                        var id = $(this).find("#movie_id");
                        id.val(searchResults.results[i].id);
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

//loads past initial 5
function loadMore(){
    var numResults = searchData.results.length;
    if(loaded === false){
        for(var i = 5; i < numResults; i++){
            var poster = searchData.results[i].poster_path;
            //some movies dont have posters
            if(poster != null){
                const new_image = "https://www.themoviedb.org/t/p/w600_and_h900_bestv2/" + poster;
                const resultHtml = `
                    <div class="well search-result text-bg-dark">
                    <div class="row">
                        <div class="col-xs-6 col-sm-3 col-md-3 col-lg-2"> <img class="img-responsive"
                            src="${new_image}" width = "200" height = "300" alt=""></div>
                        <div class="col-xs-6 col-sm-9 col-md-9 col-lg-10 title">
                            <input type = "hidden" id = movie_id value="${searchData.results[i].id}">
                            <h3>"${searchData.results[i].title}"</h3>
                            <p>"${searchData.results[i].overview}"</p>
                            <div class="dropdown">
                                <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Dropdown button
                                </button>
                            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                            <a class="dropdown-item" href="#">Action</a>
                            <a class="dropdown-item" href="#">Another action</a>
                            <a class="dropdown-item" href="#">Something else here</a>
                         </div>
                        </div>
                        </div>
                    </div>
                    </div>
                `;

                $("#search-results-section").append(resultHtml);
            }
        }
        loaded = true;
    }
}

//when scrolling to the bottom of the page, loads more
function onScroll() {
    const scrollPosition = $(window).scrollTop();
    const documentHeight = $(document).height();
    const windowHeight = $(window).height();

    if (scrollPosition + windowHeight >= documentHeight - 100) {
        loadMore();
    }
}
$(window).on("scroll", onScroll);

//movie score selector
$(document).ready(function () {
    // Add a click event handler to each dropdown item
    $(".dropdown-item").on("click", function () {
      // Get the selected score from the clicked item
      var selectedScore = parseInt($(this).text().split(" - ")[0]);
  
      // Get the movie ID from the data attribute
      var movieId = $(this).parent().parent().siblings("#movie_id").val();       
      
      // Send the selected score and movie ID to the server (e.g., via AJAX)
      $.ajax({
        url: "/save-movie-score", // Replace with your server endpoint
        method: "POST",
        data: { movieId: movieId, score: selectedScore },
        success: function (response) {
          // Handle the server's response (e.g., display a success message)
          console.log(response);
        },
        error: function (error) {
          // Handle errors (e.g., display an error message)
          console.error(error);
        },
      });
    });
  });
  

