const elements = document.querySelectorAll('.btn');

elements.forEach(element => {
    element.addEventListener('click', () => {
        let command = element.dataset['element'];

        if (command == 'createLink' || command == 'insertImage') {
            let url = prompt('Enter the link:', 'http://')
            document.execCommand(command, false, url);
        }
        else {
            document.execCommand(command, false, null);
        }
    });
});

function createProfile() {
    var profileDiv = document.createElement("div");
    var pictureDiv = document.createElement("div");
    var infoDiv = document.createElement("div");

    var picture = document.createElement("img");
    var username = document.createElement("p");

    picture.src = "images/aurora.jpeg";

    profileDiv.classList.add("profile-container");
    picture.classList.add("profile-picture");
    infoDiv.classList.add("user-info");

    infoDiv.textContent = "@aurora";

    pictureDiv.appendChild(picture);
    infoDiv.appendChild(username);

    profileDiv.appendChild(pictureDiv);
    profileDiv.appendChild(infoDiv);

    return profileDiv;
}

function addComment() {
    var text = document.getElementById("commentinput").innerText;
    if (text.trim() === "") {
        alert("Please enter a comment.");
        return;
    }
    var comment = createComment(text);
    document.getElementById("comments").appendChild(comment);
    document.getElementById("commentinput").innerText = "";
}

function createComment(text) {
    var commentDiv = document.createElement("div");
    commentDiv.classList.add("comment");

    commentDiv.appendChild(createProfile());

    var commentText = document.createElement("div");
            commentText.classList.add("editable");
            commentText.innerText = text;
            commentDiv.appendChild(commentText);

            var editButton = document.createElement("button");
            editButton.innerHTML = "Edit";
            editButton.onclick = function() {
                toggleEdit(this);
            };
            commentDiv.appendChild(editButton);

            var deleteButton = document.createElement("button");
            deleteButton.innerHTML = "Delete";
            deleteButton.onclick = function() {
                deleteComment(this);
            };
            commentDiv.appendChild(deleteButton);

    var replyText = document.createElement("div");
    replyText.classList.add("replyInput");
    replyText.style.outline = "none"; 
    replyText.style.fontSize = "16px"; 
    replyText.contentEditable = true;
    replyText.setAttribute("placeholder", "Reply to this comment");
    replyText.onkeydown = function(event) {
        handleReplyKeyDown(event);
    };
    commentDiv.appendChild(replyText);

    var replyButton = document.createElement("button");
    replyButton.innerHTML = "Reply";
    replyButton.onclick = function() {
        addReply(this);
    };

    
    

    commentDiv.appendChild(replyButton);

    var collapseButton = document.createElement("button");
    collapseButton.innerHTML = "Collapse";
    collapseButton.onclick = function() {
        toggleCollapse(this);
    };
    commentDiv.appendChild(collapseButton);

    return commentDiv;
}

function addReply(button) {
    var parentComment = button.parentNode;
    var text = parentComment.querySelector(".replyInput").innerText;
    if (text.trim() === "") {
        alert("Please enter a reply.");
        return;
    }
    var replyDiv = document.createElement("div");
    replyDiv.classList.add("reply");
    replyDiv.appendChild(createProfile());

    var replyText = document.createElement("div");
    replyText.classList.add("editable");
    replyText.innerText = text;
    replyDiv.appendChild(replyText);

    var editButton = document.createElement("button");
    editButton.innerHTML = "Edit";
    editButton.onclick = function() {
        toggleEdit(this);
    };
    replyDiv.appendChild(editButton);

    var deleteButton = document.createElement("button");
    deleteButton.innerHTML = "Delete";
    deleteButton.onclick = function() {
        deleteComment(this);
    };
    replyDiv.appendChild(deleteButton);

    var nestedReplyText = document.createElement("div");
    nestedReplyText.style.outline = "none"; 
    nestedReplyText.style.fontSize = "16px"; 
    nestedReplyText.classList.add("replyInput");
    nestedReplyText.contentEditable = true;
    nestedReplyText.setAttribute("placeholder", "Reply to this reply");
    nestedReplyText.onkeydown = function(event) {
        handleReplyKeyDown(event);
    };
    replyDiv.appendChild(nestedReplyText);

    var nestedReplyButton = document.createElement("button");
    nestedReplyButton.innerHTML = "Reply";
    nestedReplyButton.onclick = function() {
        addReply(this);
    };
    replyDiv.appendChild(nestedReplyButton);

    var collapseButton = document.createElement("button");
    collapseButton.innerHTML = "Collapse";
    collapseButton.onclick = function() {
        toggleCollapse(this);
    };
    replyDiv.appendChild(collapseButton);

    parentComment.appendChild(replyDiv);
    parentComment.querySelector(".replyInput").innerText = "";
}


function toggleCollapse(button) {
    var parentComment = button.parentNode;
    var childComments = parentComment.querySelectorAll(".comment, .reply");
    childComments.forEach(function(child) {
        if (child.classList.contains("collapse")) {
            child.classList.remove("collapse");
            button.innerHTML = "Collapse";
        } else {
            child.classList.add("collapse");
            button.innerHTML = "Expand";
        }
    });
}

function toggleEdit(button) {
    var parentComment = button.parentNode;
    var editableDiv = parentComment.querySelector(".editable");
    if (editableDiv.contentEditable === "true") {
        editableDiv.contentEditable = false;
        button.innerHTML = "Edit";
    } else {
        editableDiv.contentEditable = true;
        button.innerHTML = "Save";
    }
}

function deleteComment(button) {
    var parentComment = button.parentNode;
    parentComment.parentNode.removeChild(parentComment);
}

function handleKeyDown(event) {
    if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault();
        addComment();
    }
}

function handleReplyKeyDown(event) {
    if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault();
        addReply(event.target.parentNode.querySelector("button"));
    }
}

/** 
const cancel = document.getElementById('cancelbtn');
const post = document.getElementById('postbtn');
cancel.addEventListener("reset", function1);

function function1 () {
    document.getElementById("title").reset();
}

post.addEventListener("click", )

*/
