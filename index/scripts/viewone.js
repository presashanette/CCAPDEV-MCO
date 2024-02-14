function deletePost() {
    alert('Post deleted successfully.');
    window.location.href = "../index.html";
}

function editPost() {
    window.location.href = "../edit.html";
}



function upvotePost() {
    document.getElementById("upvote-count").textContent++;
}

function downvotePost() {
    document.getElementById("downvote-count").textContent++;
}

