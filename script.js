const channel = new BroadcastChannel('emergency_channel');
let sosAlerts = [];
let myTabId = 'tab_' + Math.random().toString(36).substr(2, 9);
let isVolunteer = false;
let myAlertId = null;
let myAssignedAlert = null;
let alertInterval;

document.getElementById('tabId').textContent = myTabId;
document.getElementById('currentRole').textContent = 'Visitor';

channel.onmessage = function(event) {
    console.log('📨 MESSAGE RECEIVED:', event.data);
    
    if (event.data.type === 'SOS_ALERT') {
        console.log('✅ SOS received by', myTabId);
        sosAlerts.push(event.data.alert);
        if (isVolunteer) displayAlerts();
    } 
    else if (event.data.type === 'ALERT_ACKNOWLEDGED') {
        console.log('✅ ACKNOWLEDGED received by', myTabId);
        updateAlertStatus(event.data.alertId, event.data.tabId);
        notifyHelpSeeker(event.data.alertId, event.data.tabId);
    } 
    else if (event.data.type === 'HELP_RECEIVED') {
        console.log('✅ HELP RECEIVED received');
        completeTask(event.data.alertId, event.data.tabId);
    }
};

function showHelp() {
    document.getElementById('choiceSection').style.display = 'none';
    document.getElementById('sosSection').style.display = 'block';
    document.getElementById('volunteerSection').style.display = 'none';
    document.getElementById('currentRole').textContent = 'Help Seeker';
}

function showVolunteer() {
    document.getElementById('choiceSection').style.display = 'none';
    document.getElementById('sosSection').style.display = 'none';
    document.getElementById('volunteerSection').style.display = 'block';
    document.getElementById('currentRole').textContent = 'Volunteer';
    isVolunteer = true;
    displayAlerts();
    if (alertInterval) clearInterval(alertInterval);
    alertInterval = setInterval(displayAlerts, 2000);
}

function backToStart() {
    document.getElementById('sosSection').style.display = 'none';
    document.getElementById('volunteerSection').style.display = 'none';
    document.getElementById('choiceSection').style.display = 'flex';
    document.getElementById('currentRole').textContent = 'Visitor';
    isVolunteer = false;
    myAssignedAlert = null;
    document.getElementById('help-status-updates').innerHTML = '';
    document.getElementById('help-received-section').style.display = 'none';
    document.getElementById('persistent-alert-info').innerHTML = '';
    if (alertInterval) clearInterval(alertInterval);
}

async function sendSOS() {
    const statusDiv = document.getElementById('status');
    const locationDiv = document.getElementById('location');
    
    statusDiv.innerHTML = '📍 Getting your exact location...';
    statusDiv.style.color = '#f39c12';

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const timestamp = new Date().toLocaleString();
        const alertId = Date.now();
        myAlertId = alertId;
        
        const sosAlert = {
            id: alertId,
            lat: lat,
            lng: lng,
            timestamp: timestamp,
            status: 'pending',
            acknowledgedBy: null,
            tabId: myTabId
        };
        
        console.log('🚨 SENDING SOS FROM', myTabId, sosAlert);
        channel.postMessage({
            type: 'SOS_ALERT',
            alert: sosAlert,
            tabId: myTabId
        });
        
        locationDiv.innerHTML = `
            <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">
                📍 Your Location Shared
            </div>
            <div style="font-size: 1.3rem; color: #27ae60; font-weight: 700;">
                ${lat.toFixed(6)}, ${lng.toFixed(6)}
            </div>
            <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" class="map-link" style="margin-top: 1rem;">
                🗺️ Open in Google Maps
            </a>
        `;
        
        statusDiv.innerHTML = '🚨 SOS Broadcasted! Waiting for nearest volunteer...';
        statusDiv.style.color = '#f39c12';
        
    } catch (error) {
        statusDiv.innerHTML = '❌ Location access denied. Please enable location permissions.';
        statusDiv.style.color = '#e74c3c';
    }
}

function displayAlerts() {
    const container = document.getElementById('alerts-container');
    const pendingAlerts = sosAlerts.filter(a => a.status === 'pending');
    
    document.getElementById('alert-count').textContent = pendingAlerts.length;
    
    if (pendingAlerts.length === 0) {
        container.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-check-circle"></i>
                <p>No active emergencies nearby</p>
                <small style="color: #7f8c8d;">You'll be notified instantly when help is needed</small>
            </div>
        `;
        return;
    }
    
    let html = `<div class="alerts-list">`;
    pendingAlerts.forEach(alert => {
        html += `
            <div class="alert-box" id="alert-${alert.id}">
                <div class="alert-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <h4>Emergency Alert #${alert.id}</h4>
                        <span class="alert-time">${alert.timestamp}</span>
                    </div>
                </div>
                <div class="alert-location">
                    📍 ${alert.lat.toFixed(6)}, ${alert.lng.toFixed(6)}
                </div>
                <div class="alert-from">From: ${alert.tabId}</div>
                <div class="alert-actions">
                    <a href="https://www.google.com/maps?q=${alert.lat},${alert.lng}" target="_blank" class="map-link">🗺️ View Map</a>
                    <button onclick="acknowledgeAlert(${alert.id})" class="help-btn">
                        <i class="fas fa-hands-helping"></i> I'll Help
                    </button>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function acknowledgeAlert(alertId) {
    const alert = sosAlerts.find(a => a.id === alertId);
    if (alert && alert.status === 'pending') {
        alert.status = 'acknowledged';
        alert.acknowledgedBy = myTabId;
        alert.acknowledgedTime = new Date().toLocaleString();
        myAssignedAlert = alert;
        
        console.log('✅ VOLUNTEER ACCEPTING from', myTabId);
        channel.postMessage({
            type: 'ALERT_ACKNOWLEDGED',
            alertId: alertId,
            tabId: myTabId
        });
        
        displayAlerts();
        updatePersistentAlertInfo(); // ✅ THIS SHOWS THE MAP BUTTON
        document.getElementById('volunteer-status').textContent = `Responding to Emergency #${alertId}`;
    }
}

// ✅ FIXED: Persistent Map Button - ALWAYS VISIBLE after accepting
function updatePersistentAlertInfo() {
    if (myAssignedAlert && isVolunteer) {
        const container = document.getElementById('persistent-alert-info');
        container.innerHTML = `
            <div class="persistent-info">
                <div class="assigned-header">
                    <i class="fas fa-map-marker-alt"></i>
                    <h4>YOUR ASSIGNED EMERGENCY</h4>
                </div>
                <div class="assigned-location">
                    📍 ${myAssignedAlert.lat.toFixed(6)}, ${myAssignedAlert.lng.toFixed(6)}
                </div>
                <div class="assigned-time">
                    Started: ${myAssignedAlert.timestamp}
                </div>
                <div class="assigned-actions">
                    <a href="https://www.google.com/maps?q=${myAssignedAlert.lat},${myAssignedAlert.lng}" target="_blank" class="map-link" style="background: linear-gradient(135deg, #f39c12, #e67e22); font-size: 1.1rem; padding: 1rem 2rem; margin: 0.5rem;">
                        <i class="fas fa-map"></i> OPEN MAP & NAVIGATE
                    </a>
                    <div class="status-badge">Waiting for confirmation...</div>
                </div>
            </div>
        `;
    }
}

function notifyHelpSeeker(alertId, volunteerTabId) {
    console.log('🔔 NOTIFYING HELP SEEKER for alert', alertId);
    
    if (!isVolunteer && myAlertId && myAlertId == alertId) {
        console.log('🎉 HELP SEEKER NOTIFIED!', myTabId);
        
        const statusDiv = document.getElementById('status');
        const updatesDiv = document.getElementById('help-status-updates');
        
        statusDiv.innerHTML = `
            <div style="color: #27ae60; font-size: 1.5rem; font-weight: 700;">
                <i class="fas fa-hands-helping"></i> HELP IS ON THE WAY!
            </div>
        `;
        
        updatesDiv.innerHTML = `
            <div class="status-updates help-accepted">
                <div class="update-header">
                    <i class="fas fa-check-circle"></i>
                    <h3>Volunteer Accepted Your Request!</h3>
                </div>
                <div class="update-details">
                    <p><strong>🚗 Volunteer ID:</strong> ${volunteerTabId}</p>
                    <p><strong>⏰ Response Time:</strong> ${new Date().toLocaleTimeString()}</p>
                    <p><strong>📍 Location Shared:</strong> They have your exact GPS coordinates</p>
                </div>
            </div>
        `;
        
        document.getElementById('help-received-section').style.display = 'block';
        showNotification('🚨 VOLUNTEER RESPONDING!', `Volunteer ${volunteerTabId.slice(0,8)}... accepted your SOS!`);
    }
}

function showNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'notification-box';
    notification.innerHTML = `
        <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">${title}</div>
        <div style="font-size: 0.95rem;">${message}</div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 6000);
}

function helpReceived() {
    if (myAlertId) {
        console.log('✅ HELP RECEIVED from', myTabId);
        channel.postMessage({
            type: 'HELP_RECEIVED',
            alertId: myAlertId,
            tabId: myTabId
        });
        backToStart();
    }
}

function updateAlertStatus(alertId, volunteerTabId) {
    const alert = sosAlerts.find(a => a.id == alertId);
    if (alert) {
        alert.status = 'acknowledged';
        alert.acknowledgedBy = volunteerTabId;
        alert.acknowledgedTime = new Date().toLocaleString();
        if (isVolunteer) {
            displayAlerts();
            if (myTabId === volunteerTabId) {
                myAssignedAlert = alert;
                updatePersistentAlertInfo(); // ✅ MAP BUTTON APPEARS HERE
            }
        }
    }
}

function completeTask(alertId, helpSeekerTabId) {
    const alert = sosAlerts.find(a => a.id == alertId);
    if (alert && isVolunteer && myAssignedAlert && myAssignedAlert.id == alertId) {
        document.getElementById('volunteer-status').textContent = '✅ Emergency Resolved';
        document.getElementById('persistent-alert-info').innerHTML = `
            <div class="persistent-info" style="border-left-color: #27ae60;">
                <div class="assigned-header">
                    <i class="fas fa-check-circle"></i>
                    <h4>✅ EMERGENCY SUCCESSFULLY RESOLVED</h4>
                </div>
                <p><strong>Helped:</strong> ${helpSeekerTabId}</p>
                <p style="color: #27ae60; font-weight: 600;">Excellent work, volunteer!</p>
            </div>
        `;
        showNotification('🎉 MISSION COMPLETE!', 'Help seeker confirmed your assistance!');
    }
}