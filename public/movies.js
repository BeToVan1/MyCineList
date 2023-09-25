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
                $(".userlist").hide();
                $(".register-page").hide();
                $("#NowPlaying").hide();
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
                    <div class="well search-result text-bg-dark my-3">
                    <div class="row">
                        <div class="col-xs-6 col-sm-3 col-md-3 col-lg-1-half"> <img class="img-responsive"
                            src="${new_image}" width = "200" height = "300" alt=""></div>
                        <div class="col-xs-6 col-sm-9 col-md-9 col-lg-10-half title">
                            <input type = "hidden" id = movie_id value="${searchData.results[i].id}">
                            <h3>"${searchData.results[i].title}"</h3>
                            <p>"${searchData.results[i].overview}"</p>
                            <div class="dropdown">
                <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  Add to list
                </button>
                <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                  <a class="dropdown-item" href="#">1 - Horrendous</a>
                  <a class="dropdown-item" href="#">2 - Horrible</a>
                  <a class="dropdown-item" href="#">3 - Awful</a>
                  <a class="dropdown-item" href="#">4 - Very Bad</a>
                  <a class="dropdown-item" href="#">5 - Bad</a>
                  <a class="dropdown-item" href="#">6 - Fine</a>
                  <a class="dropdown-item" href="#">7 - Mediocre</a>
                  <a class="dropdown-item" href="#">8 - Great</a>
                  <a class="dropdown-item" href="#">9 - Amazing</a>
                  <a class="dropdown-item" href="#">10 - Masterpiece</a>
                </div>
              </div>
                        </div>
                    </div>
                    </div>
                    <hr>
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
    $("#search-results-section").on("click",".dropdown-item", function () {
      // Get the selected score from the clicked item
      var selectedScore = parseInt($(this).text().split(" - ")[0]);
  
      // Get the movie ID from the data attribute
      var movieId = $(this).parent().parent().siblings("#movie_id").val();      
      
      //get movie image
      var searchResult = $(this).closest(".search-result");
      var imgElement = searchResult.find("img");
      var srcValue = imgElement.attr("src");
     
      

      //get movie title
      var title = searchResult.find("h3").text();
     
      // Send the selected score and movie ID to the server (e.g., via AJAX)
      $.ajax({
        url: "/save-movie-score", // Replace with your server endpoint
        method: "POST",
        data: { movieId: movieId, score: selectedScore, imgURL: srcValue, title: title },
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

    //updates users score if they change on mylist
    $(".userlist").on("click", ".dropdown-item",function(){
      var selectedScore = parseInt($(this).text().split(" - ")[0]);
      var movieId = $(this).parent().parent().siblings("#movie_id").val();  
      var button = $(this).parent().siblings("#dropdownMenuButton"); 
      button.text(selectedScore);
      
      $.ajax({
        url: "/save-movie-score", // Replace with your server endpoint
        method: "POST",
        data: { movieId: movieId, score: selectedScore},
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

    NowPlayingCarousel();
  });
  
//Now playing carousel
function NowPlayingCarousel(){

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMTE5MzkyZDJjNDRlNWYzYjI3MGY1YWRlNWFjMjIxZCIsInN1YiI6IjY0ZmFkYWM2ZmZjOWRlMDEzOGViYWZhZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.CXi3K75a6AwYUhEm8yG_QtO2colywujc7Mi3MymUozw'
    }
  };
    // Fetch data about now playing movies from the API (similar to your previous fetch code)
  fetch('https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1', options)
    .then(response => response.json())
    .then(data => {
    // Assuming data.results is an array of movie objects with image URLs
    const movieData = data.results;

  // Select the carousel's img elements
    const carouselImages = document.querySelectorAll('#NowPlaying .carousel-item img');

  // Loop through the movieData and update the src attributes of the carousel images
    for (let i = 0; i < movieData.length && i < carouselImages.length; i++) {
      const imageUrl = movieData[i].poster_path; // Assuming the API response has image URLs
      carouselImages[i].src = `https://image.tmdb.org/t/p/w500${imageUrl}`;
      carouselImages[i].width = 200;
      carouselImages[i].height = 500;
      carouselImages[i].alt = `Slide ${i + 1}`; // You can set alt text as desired
    }
  })
  .catch(err => console.error(err));

  }
  
