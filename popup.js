document.addEventListener('DOMContentLoaded', function() {
  const noteArea = document.getElementById('noteArea');
  const saveBtn = document.getElementById('saveBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const statusMessage = document.getElementById('statusMessage');
  const statusMessage2 = document.getElementById('statusMessage2');
  const noteMenu = document.getElementById('noteMenu');
  const noteName = document.getElementById('noteName');
  const storageMeter = document.getElementById('storageMeter');
  const storageBar = document.getElementById('storageBar');
  const storageLimit = 102400; // 100KB in bytes

  // Load notes from storage and create note squares
  function loadNotes() {
    chrome.storage.sync.get(null, function(data) {
      noteMenu.innerHTML = ''; // Clear existing note squares

      for (const key in data) {
        if (data.hasOwnProperty(key) && key.startsWith('note_')) {
          const note = data[key];
          const [name, content] = note.split('|', 2); // Split stored note into name and content
          const noteSquare = document.createElement('div');
          noteSquare.className = 'note-square';
          noteSquare.innerHTML = `<div class="note-name">${name}</div>`; // Display note name
          noteSquare.onclick = function() {
            noteArea.value = content; // Set the textarea to the selected note's content
            noteArea.dataset.key = key; // Store the note key in a data attribute
            noteName.value = name; // Set the note name input field
          };
          noteMenu.appendChild(noteSquare);
        }
      }
      updateStorageMeter();
    });
  }

  // Check if adding the note will exceed storage limit
  function checkStorageLimit(newNoteSize, callback) {
    chrome.storage.sync.getBytesInUse(function(bytesInUse) {
      if (bytesInUse + newNoteSize <= storageLimit) {
        callback(true); // Within limit
      } else {
        callback(false); // Exceeds limit
      }
    });
  }

  // Save the note to storage
  saveBtn.addEventListener('click', function() {
    const content = noteArea.value;
    const name = noteName.value || 'Unnamed Note'; // Default name if none provided
    const key = noteArea.dataset.key || 'note_' + Date.now(); // Use a unique key if no key is set
    const noteData = `${name}|${content}`; // Store name and content together

    const newNoteSize = new Blob([noteData]).size; // Size of new note in bytes

    checkStorageLimit(newNoteSize, function(withinLimit) {
      if (withinLimit) {
        const notes = {};
        notes[key] = noteData;

        chrome.storage.sync.set(notes, function() {
          statusMessage.innerHTML = 'Note saved!';
          setTimeout(() => {
            statusMessage.innerHTML = '';
          }, 2000);
          loadNotes(); // Reload notes to update the menu
        });
      } else {
        statusMessage2.innerHTML = 'Storage limit exceeded!';
        setTimeout(() => {
          statusMessage2.innerHTML = '';
        }, 2000);
      }
    });
  });

  // Delete the selected note
  deleteBtn.addEventListener('click', function() {
    const key = noteArea.dataset.key;
    if (key) {
      chrome.storage.sync.remove(key, function() {
        statusMessage.innerHTML = 'Note deleted!';
        setTimeout(() => {
          statusMessage.innerHTML = '';
        }, 2000);
        noteArea.value = ''; // Clear the textarea
        noteName.value = ''; // Clear the note name input
        loadNotes(); // Reload notes to update the menu
      });
    } else {
      statusMessage.innerHTML = 'No note selected!';
      setTimeout(() => {
        statusMessage.innerHTML = '';
      }, 2000);
    }
  });

  // Update the storage meter
  function updateStorageMeter() {
    chrome.storage.sync.getBytesInUse(function(bytesInUse) {
      const percentageUsed = (bytesInUse / storageLimit) * 100;

      storageMeter.innerText = `Cloud storage used: ${(bytesInUse / 1024).toFixed(1)} KB / 100 KB`;
      storageBar.style.width = `${percentageUsed}%`;
    });
  }

  // Initial load of notes
  loadNotes();
});
