function deletePost() {
    alert('Post deleted successfully.');
    window.location.href = "../index.html";
}

function editPost() {
    window.location.href = "../edit.html";
}

var isUpvoted = false;
var isDownvoted = false;


function upvotePost() {
    if (isUpvoted == false && isDownvoted == false){
        isUpvoted = true;
        document.getElementById("upvote-count").textContent++;
    }

    else if (isUpvoted == false && isDownvoted == true){
        isUpvoted = true;
        isDownvoted = false;
        document.getElementById("upvote-count").textContent++;
        document.getElementById("downvote-count").textContent--;
    }

    else if (isUpvoted == true){
        isUpvoted = false;
        document.getElementById("upvote-count").textContent--;

    }
}

function downvotePost() {
    if (isUpvoted == false && isDownvoted == false){
        isDownvoted = true;
        document.getElementById("downvote-count").textContent++;
    }

    else if (isUpvoted == true && isDownvoted == false){
        isUpvoted = false;
        isDownvoted = true;
        document.getElementById("upvote-count").textContent--;
        document.getElementById("downvote-count").textContent++;
    }

    else if (isDownvoted == true){
        isDownvoted = false;
        document.getElementById("downvote-count").textContent--;

    }
}

