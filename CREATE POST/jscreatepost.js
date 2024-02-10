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

const tagInput = document.getElementById('tag-input');
const tagContainer = document.querySelector('.tag-input-container');
  
tagInput.addEventListener('keypress', function(event) {
if (event.key === 'Enter') {
    const tag = tagInput.value.trim();
    if (tag !== '') {
    addTag(tag);
    tagInput.value = '';
    }
}
});

function addTag(tag) {
    const tagElement = document.createElement('div');
    tagElement.classList.add('tag');
    tagElement.textContent = tag;
    tagElement.addEventListener('click', function() {
        tagElement.remove();
    });

    const tagContainerDiv = document.createElement('div');
    tagContainerDiv.classList.add('tag-container');
    tagContainerDiv.appendChild(tagElement);

    tagContainer.appendChild(tagContainerDiv);
}