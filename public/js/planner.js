let locationCount = 0;
let friends = [];
let selectedFriends = [];
let messages = [];

const plannerData = document.getElementById('plannerData');
const currentUser = plannerData?.dataset.currentUser || document.querySelector('script').textContent.match(/currentUser = "([^"]+)"/)?.[1];
const editTripId = plannerData?.dataset.editTripId;

let editTrip = null;
if (plannerData?.dataset.editTrip) {
    editTrip = JSON.parse(plannerData.dataset.editTrip);
}

// Initialize
async function init() {
    await loadFriends();


    if (editTrip) {
        console.log('=== EDIT TRIP DEBUG ===');
        console.log('Edit trip locations:', editTrip.locations);
        editTrip.locations.forEach((loc, i) => {
            console.log(`Location ${i}:`, {
                country: loc.country,
                visited: loc.visited,
                visited_type: typeof loc.visited,
                visited_value: loc.visited === 1 ? 'is 1' : loc.visited === true ? 'is true' : 'is something else'
            });
        });
        console.log('======================');
        loadMessages();
        document.getElementById('tripTitle').value = editTrip.title;
        document.getElementById('tripDescription').value = editTrip.description || '';

        selectedFriends = editTrip.participants
            .filter(p => p.username !== currentUser)
            .map(p => p.username);
        updateFriendSelection();
        updateParticipants();

        // ✅ ALLEEN locations toevoegen als de container LEEG is
        const container = document.getElementById('locationsContainer');
        if (container.children.length === 0) {
            if (editTrip.locations && editTrip.locations.length > 0) {
                editTrip.locations.forEach(loc => addLocation(loc));
            } else {
                addLocation();
            }
        }
    } else {
        addLocation();
    }
}

async function loadFriends() {
    try {
        friends = await (await fetch('/api/friends')).json();
        const friendsList = document.getElementById('friendsList');
        friendsList.innerHTML = friends.map(friend => `
            <div class="friend-item" data-username="${friend.username}">
                <div class="friend-avatar">${friend.firstName[0]}</div>
                <div>
                    <div style="font-weight: 600">${friend.firstName} ${friend.lastName}</div>
                    <div style="font-size: 12px; color: #888">@${friend.username}</div>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.friend-item').forEach(item => {
            item.addEventListener('click', () => toggleFriend(item.dataset.username));
        });
    } catch (err) {
        console.error('Failed to load friends', err);
    }
}

function toggleFriend(username) {
    console.log('Toggling friend:', username);
    const index = selectedFriends.indexOf(username);
    if (index > -1) {
        selectedFriends.splice(index, 1);
    } else {
        selectedFriends.push(username);
    }
    console.log('Selected friends now:', selectedFriends);
    updateFriendSelection();
    updateParticipants();
}

function updateFriendSelection() {
    document.querySelectorAll('.friend-item').forEach(item => {
        const username = item.dataset.username;
        if (selectedFriends.includes(username)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function updateParticipants() {
    const participantsList = document.getElementById('participantsList');
    const participantsHTML = selectedFriends.map(username => {
        const friend = friends.find(f => f.username === username);
        if (!friend) return '';
        return `
            <span class="participant-tag">
                ${friend.firstName}
                <span class="remove" onclick="toggleFriend('${username}')">✕</span>
            </span>
        `;
    }).join('');

    participantsList.innerHTML = '<span class="participant-tag">You </span>' + participantsHTML;
}

function addLocation(locData) {
    const container = document.getElementById("locationsContainer");
    const index = container.children.length;

    const div = document.createElement("div");
    div.classList.add("location-card");

    // ✅ Format date correctly for input type="date"
    let formattedDate = '';
    if (locData?.date) {
        // Convert "2025-12-14T23:00:00.000Z" to "2025-12-14"
        formattedDate = locData.date.split('T')[0];
    }

    const isVisited = locData?.visited === 1 || locData?.visited === true;
    
    div.innerHTML = `
        <div class="location-number">${index + 1}</div>
        <div class="location-content">
            <div class="location-inputs">
                <input type="text" name="locations[${index}][country]" placeholder="Country" value="${locData?.country || ''}" list="country-options" autocomplete="off">
                <input type="text" name="locations[${index}][city]" placeholder="City" value="${locData?.city || ''}" list="city-options" autocomplete="off">
                <input type="date" name="locations[${index}][date]" value="${formattedDate}">
                <input type="text" name="locations[${index}][activity]" placeholder="Activity" value="${locData?.activity || ''}">

                <button type="button" 
                        class="visited-toggle ${isVisited ? 'visited' : 'not-visited'}" 
                        onclick="toggleVisited(this)"
                        data-visited="${isVisited ? 'true' : 'false'}">
                    ${isVisited ? '✓ Visited' : '○ Yet to Visit'}
                </button>
                
            </div>
            <button type="button" class="remove-location" onclick="removeExistingLocation(this)">Remove</button>
        </div>
    `;

    container.appendChild(div);
}

function removeExistingLocation(button) {
    button.closest(".location-card").remove();
}

async function saveTrip() {

    console.log('🚀 saveTrip called');
    console.log('🔍 selectedFriends at start:', selectedFriends);
    console.log('🔍 selectedFriends length:', selectedFriends.length);
    console.log('🔍 typeof selectedFriends:', typeof selectedFriends);
    console.log('🔍 Array?:', Array.isArray(selectedFriends));
    
    // Als het een array is maar leeg, check waarom:
    if (Array.isArray(selectedFriends) && selectedFriends.length === 0) {
        console.log('⚠️ WARNING: selectedFriends is empty!');
        console.log('🔍 friends array:', friends);
        console.log('🔍 Check if toggleFriend was called');
    }
    
    const title = document.getElementById('tripTitle').value.trim();
    const description = document.getElementById('tripDescription').value.trim();
    const budget = parseFloat(document.getElementById('tripBudget').value) || 0;

    if (!title) {
        alert('Please enter a trip title!');
        return;
    }

    // Collect locations
    const locations = [];
    document.querySelectorAll('.location-card').forEach(card => {
        const countryInput = card.querySelector('input[name*="[country]"]');
        const cityInput = card.querySelector('input[name*="[city]"]');
        const dateInput = card.querySelector('input[name*="[date]"]');
        const activityInput = card.querySelector('input[name*="[activity]"]');
        const visitedButton = card.querySelector('.visited-toggle');
        const visited = visitedButton ? visitedButton.dataset.visited === 'true' : false;
        
        if (countryInput && cityInput) {
            const location = {
                country: countryInput.value.trim(),
                city: cityInput.value.trim(),
                date: dateInput ? dateInput.value : '',
                activity: activityInput ? activityInput.value.trim() : '',
                visited: visited
            };
            
            if (location.country && location.city) {
                locations.push(location);
            }
        }
    });

    if (locations.length === 0) {
        alert('Please add at least one complete location!');
        return;
    }

    // Build trip data object
    const tripData = {
        title: title,
        description: description,
        locations: locations,
        budget: budget,
        participants: selectedFriends
    };

    console.log('📦 Trip data:', tripData);
    console.log('👥 Participants in object:', tripData.participants);

    try {
        const url = editTripId ? `/planner/update/${editTripId}` : '/planner/create';
        console.log('Sending to:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tripData)
        });

        const result = await response.json();
        console.log('Result:', result);

        if (result.success) {
            alert('Trip saved!');
            window.location.href = `/trips/${currentUser}`;
        } else {
            alert('Failed to save trip');
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Network error');
    }
}

async function loadMessages() {
    try {
        const response = await fetch(`/planner/messages?tripId=${editTripId}`);
        const data = await response.json();
        messages = data.messages || [];
        messages.forEach(displayMessage);
    } catch (err) {
        console.error('Failed to load messages:', err);
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;

    const msgObj = {
        tripId: editTripId,
        username: currentUser,
        message: text
    };

    const localMsgObj = {
        username: currentUser,
        message: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    messages.push(localMsgObj);
    displayMessage(localMsgObj);
    input.value = '';

    try {
        const response = await fetch('/planner/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msgObj)
        });
        const result = await response.json();
        if (!result.success) {
            alert('Failed to send message');
        }
    } catch (err) {
        console.error('Error sending message:', err);
    }
}

function displayMessage(msg) {
    const container = document.getElementById('chatMessages');
    const emptyState = container.querySelector('.empty-state');

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.username === currentUser ? 'own' : 'other'}`;
    messageDiv.innerHTML = `
        ${msg.username !== currentUser ? `<div class="message-sender">${msg.username}</div>` : ''}
        <div class="message-bubble">${msg.message}</div>
        <div class="message-time">${msg.time}</div>
    `;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function toggleVisited(button) {
    console.log('=== TOGGLE VISITED ===');
    console.log('Current dataset.visited:', button.dataset.visited);
    console.log('Type:', typeof button.dataset.visited);
    
    const currentVisited = button.dataset.visited === 'true';
    const newVisited = !currentVisited;
    
    console.log('Current visited (boolean):', currentVisited);
    console.log('New visited (boolean):', newVisited);
    
    button.dataset.visited = newVisited ? 'true' : 'false';
    button.textContent = newVisited ? '✓ Visited' : '○ Yet to Visit';
    button.className = `visited-toggle ${newVisited ? 'visited' : 'not-visited'}`;
    
    console.log('Updated dataset.visited:', button.dataset.visited);
    console.log('====================');
}

window.addEventListener('DOMContentLoaded', init);
