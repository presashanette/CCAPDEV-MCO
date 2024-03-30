// // Fetch comments when the page loads
// fetchComments();

// // Event listener for editing a comment
// document.addEventListener('click', async (event) => {
//     if (event.target.classList.contains('edit-btn')) {
//         const commentDiv = event.target.closest('.comment');
//         const commentId = commentDiv.dataset.commentId;
//         const newContent = prompt('Enter the new content:');
//         if (newContent !== null) {
//             const response = await fetch(`/comments/${commentId}`, {
//                 method: 'PUT',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ content: newContent })
//             });
//             if (response.ok) {
//                 const updatedComment = await response.json();
//                 commentDiv.querySelector('.editable').textContent = updatedComment.content;
//             } else {
//                 alert('Failed to update comment');
//             }
//         }
//     }
// });

// // Event listener for deleting a comment
// document.addEventListener('click', async (event) => {
//     if (event.target.classList.contains('delete-btn')) {
//         const commentDiv = event.target.closest('.comment');
//         const commentId = commentDiv.dataset.commentId;
//         const confirmDelete = confirm('Are you sure you want to delete this comment?');
//         if (confirmDelete) {
//             const response = await fetch(`/comments/${commentId}`, {
//                 method: 'DELETE'
//             });
//             if (response.ok) {
//                 commentDiv.remove();
//             } else {
//                 alert('Failed to delete comment');
//             }
//         }
//     }
// });

// // Function to fetch comments from the backend
// async function fetchComments() {
//     try {
//         const response = await fetch('/comments');
//         if (!response.ok) {
//             throw new Error('Failed to fetch comments');
//         }
//         const comments = await response.json();
//         renderComments(comments);
//     } catch (error) {
//         console.error(error.message);
//     }
// }


$(document).ready(function() {
const elements = document.querySelectorAll('.btn');

// elements.forEach(element => {
//     element.addEventListener('click', () => {
//         let command = element.dataset['element'];

//         if (command == 'createLink' || command == 'insertImage') {
//             let url = prompt('Enter the link:', 'http://')
//             document.execCommand(command, false, url);
//         }
//         else {
//             document.execCommand(command, false, null);
//         }
//     });
// });

// function createProfile() {
//     var profileDiv = document.createElement("div");
//     var pictureDiv = document.createElement("div");
//     var infoDiv = document.createElement("div");

//     var picture = document.createElement("img");
//     var username = document.createElement("p");

//     picture.src = "images/barbie.jpg";

//     profileDiv.classList.add("profile-container");
//     picture.classList.add("profile-picture");
//     infoDiv.classList.add("user-info");

//     infoDiv.textContent = "@barbie";

//     pictureDiv.appendChild(picture);
//     infoDiv.appendChild(username);

//     profileDiv.appendChild(pictureDiv);
//     profileDiv.appendChild(infoDiv);

//     return profileDiv;
// }

// function addComment() {
//     var text = document.getElementById("commentinput").innerText;
//     if (text.trim() === "") {
//         alert("Please enter a comment.");
//         return;
//     }
//     var comment = createComment(text);
//     document.getElementById("comments").appendChild(comment);
//     document.getElementById("commentinput").innerText = "";
// }

// function createComment(text) {
//     var commentDiv = document.createElement("div");
//     commentDiv.classList.add("comment");

//     commentDiv.appendChild(createProfile());

//     var commentText = document.createElement("div");
//             commentText.classList.add("editable");
//             commentText.innerText = text;
//             commentDiv.appendChild(commentText);

//             var editButton = document.createElement("button");
//             editButton.innerHTML = "Edit";
//             editButton.onclick = function() {
//                 toggleEdit(this);
//             };
//             commentDiv.appendChild(editButton);

//             var deleteButton = document.createElement("button");
//             deleteButton.innerHTML = "Delete";
//             deleteButton.onclick = function() {
//                 deleteComment(this);
//             };
//             commentDiv.appendChild(deleteButton);

//     var replyText = document.createElement("div");
//     replyText.classList.add("replyInput");
//     replyText.style.outline = "none"; 
//     replyText.style.fontSize = "16px"; 
//     replyText.contentEditable = true;
//     replyText.setAttribute("placeholder", "Reply to this comment");
//     replyText.onkeydown = function(event) {
//         handleReplyKeyDown(event);
//     };
//     commentDiv.appendChild(replyText);

//     var replyButton = document.createElement("button");
//     replyButton.innerHTML = "Reply";
//     replyButton.onclick = function() {
//         addReply(this);
//     };

    
    

//     commentDiv.appendChild(replyButton);

//     var collapseButton = document.createElement("button");
//     collapseButton.innerHTML = "Collapse";
//     collapseButton.onclick = function() {
//         toggleCollapse(this);
//     };
//     commentDiv.appendChild(collapseButton);

//     return commentDiv;
// }

// function addReply(button) {
//     var parentComment = button.parentNode;
//     var text = parentComment.querySelector(".replyInput").innerText;
//     if (text.trim() === "") {
//         alert("Please enter a reply.");
//         return;
//     }
//     var replyDiv = document.createElement("div");
//     replyDiv.classList.add("reply");
//     replyDiv.appendChild(createProfile());

//     var replyText = document.createElement("div");
//     replyText.classList.add("editable");
//     replyText.innerText = text;
//     replyDiv.appendChild(replyText);

//     var editButton = document.createElement("button");
//     editButton.innerHTML = "Edit";
//     editButton.onclick = function() {
//         toggleEdit(this);
//     };
//     replyDiv.appendChild(editButton);

//     var deleteButton = document.createElement("button");
//     deleteButton.innerHTML = "Delete";
//     deleteButton.onclick = function() {
//         deleteComment(this);
//     };
//     replyDiv.appendChild(deleteButton);

//     var nestedReplyText = document.createElement("div");
//     nestedReplyText.style.outline = "none"; 
//     nestedReplyText.style.fontSize = "16px"; 
//     nestedReplyText.classList.add("replyInput");
//     nestedReplyText.contentEditable = true;
//     nestedReplyText.setAttribute("placeholder", "Reply to this reply");
//     nestedReplyText.onkeydown = function(event) {
//         handleReplyKeyDown(event);
//     };
//     replyDiv.appendChild(nestedReplyText);

//     var nestedReplyButton = document.createElement("button");
//     nestedReplyButton.innerHTML = "Reply";
//     nestedReplyButton.onclick = function() {
//         addReply(this);
//     };
//     replyDiv.appendChild(nestedReplyButton);

//     var collapseButton = document.createElement("button");
//     collapseButton.innerHTML = "Collapse";
//     collapseButton.onclick = function() {
//         toggleCollapse(this);
//     };
//     replyDiv.appendChild(collapseButton);

//     parentComment.appendChild(replyDiv);
//     parentComment.querySelector(".replyInput").innerText = "";
// }

// function toggleCollapse(button) {
//     var parentComment = button.parentNode;
//     var childComments = parentComment.querySelectorAll(".comment, .reply");
//     childComments.forEach(function(child) {
//         if (child.classList.contains("collapse")) {
//             child.classList.remove("collapse");
//             button.innerHTML = "Collapse";
//         } else {
//             child.classList.add("collapse");
//             button.innerHTML = "Expand";
//         }
//     });
// }

// function toggleEdit(button) {
//     console.log("nyenye");
//     var parentComment = button.parentNode;
//     var editableDiv = parentComment.querySelector(".editable");
//     if (editableDiv.contentEditable === "true") {
//         editableDiv.contentEditable = false;
//         button.innerHTML = "Edit";
//     } else {
//         editableDiv.contentEditable = true;
//         button.innerHTML = "Save";
//     }
// }

// $(document).on('click', '#reply-button', function(e) {
//     const replyContent = $('.replyInput').text();
//     const $target = $(e.target);

//     const postId = $target.attr('data-post-id');
//     const parentCommentId = $target.attr('data-comment-id');

//     console.log("panget");
//     $.ajax({
//         type: 'POST',
//         url: `/reply/comment/${postId}/${parentCommentId}`,
//         data: { content: replyContent },
//         success: function(response) {
//             // Handle success response, such as displaying a message or updating the UI
//             console.log('Reply submitted successfully:', response);
//         },
//         error: function(err) {
//             // Handle error, such as displaying an error message
//             console.error('Error submitting reply:', err);
//         }
//     });

//     // Optionally, clear the replyInput field after submitting the reply
//     $('.replyInput').empty(); // or .text('') if using .text() above
// });

$(document).on('click', '#collapse-button', function(e) {
    const $button = $(this);
    const $comment = $button.closest('.comment');
    const $replyContainer = $comment.find('.reply');
    
    // Toggle the visibility of replies under the comment
    $replyContainer.toggle();
    
    // Toggle button text between "Collapse" and "Expand"
    if ($replyContainer.is(':visible')) {
        $button.text('Collapse');
    } else {
        $button.text('Expand');
    }
});

$(document).on('click', '#reply-button', function(e) {
    const $button = $(this);
    const postId = $button.attr('data-post-id');

    console.log("post id in comment REPLY" + postId);

    const parentCommentId = $button.attr('data-comment-id');
    var replyContent = $('.replyInput').text();

    $.ajax({
            type: 'POST',
            url: '/reply/comment/' + postId + '/' + parentCommentId, // Replace postId and parentCommentId with actual values
            data: { content: replyContent },
            success: function(response) {
                // Handle success
                location.reload();
                // Optionally, update the UI to reflect the successful submission
            },
            error: function(xhr, status, error) {
                // Handle errors
                console.error('Error:', error);
                // Optionally, update the UI to inform the user of the error
            }
        });
});


$(document).on('click', '#edit-button', function(e) {
    var $button = $(this);
    var parentComment = $button.closest('.comment');
    var editableDiv = parentComment.find(".editable");

    const $target = $(e.target);
    const postId = $target.attr('data-post-id');
    console.log("post id in comment EDIT" + postId);
    const commentId = $target.attr('data-comment-id');

    if (editableDiv.prop("contentEditable") === "true") {
        // If the comment is currently in edit mode (contentEditable is true)
        // Disable editing mode and update the comment content on the server
        editableDiv.prop("contentEditable", false);
        $button.text("Edit"); // Change button text back to "Edit"

        // Send an AJAX request to update the comment content on the server
        var newContent = editableDiv.text(); // Get the updated content
        $.ajax({
            type: 'PUT',
            url: `/editComment/${postId}/${commentId}`, // Update the URL 
            data: { content: newContent }, // Pass the updated content to the server
            success: function(response) {
                // Handle success response if needed
                console.log("Comment updated successfully!");
            },
            error: function(err){
                // Handle error if needed
                console.log(err);
                alert('Failed to update comment');
            }
        });
    } else {
        // If the comment is not in edit mode (contentEditable is false)
        // Enable editing mode
        editableDiv.prop("contentEditable", true);
        $button.text("Save"); // Change button text to "Save"
    }
});

  $(document).on('click', '#delete-button', function(e) {
    // const $target = $(e.target);
    // const postId = $target.attr('data-post-id');

    const $button = $(this);
    const postId = $button.attr('data-post-id');

    console.log("post id in comment DELETE" + postId);
    const commentId = $button.attr('data-comment-id');

    $.ajax({
        type: 'DELETE',
        url: `/deleteComment/${postId}/${commentId}`,
        success: function(response) {
            $button.closest('.comment').remove();
            $('#comment-count').text($('.comment').length);
            alert('Comment deleted successfully!');
        },
        error: function(err){
            console.log(err);
        }
    });
});

// function handleKeyDown(event) {
//     if (event.keyCode === 13 && !event.shiftKey) {
//         event.preventDefault();
//         addComment();
//     }
// }

// function handleReplyKeyDown(event) {
//     if (event.keyCode === 13 && !event.shiftKey) {
//         event.preventDefault();
//         addReply(event.target.parentNode.querySelector("button"));
//     }
// }

// $('#editButton').click(function() {
//     toggleEdit(this);
// });


/** 
const cancel = document.getElementById('cancelbtn');
const post = document.getElementById('postbtn');
cancel.addEventListener("reset", function1);

function function1 () {
    document.getElementById("title").reset();
}

post.addEventListener("click", )

*/
});