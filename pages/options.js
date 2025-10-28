const checkboxIds = ['useallSub', 'useddplus', 'useAVC', 'useFHD', 'usedef', 'useHA', 'useAVCH', 'usevp9', 'useav1', 'useprk', 'usehevc', 'usef4k', 'usef12k', 'closeimsc', 'useimscn', 'setMaxBitrate', 'AutoSkip', 'fkhouse'];

function getCheckbox(id) {
    return document.getElementById(id);
}

function getCheckboxState(id) {
    return getCheckbox(id).checked;
}

function updateCheckboxState(checkbox, targetCheckbox, disable) {
    targetCheckbox.disabled = checkbox.checked ? disable : !disable;
}

function updateCheckboxState2(checkbox, targetCheckbox, disable) {
    targetCheckbox.checked = checkbox.checked;
    targetCheckbox.disabled = checkbox.checked ? disable : !disable;
}

function updateRelatedCheckboxes(checkboxId) {
    if (checkboxId === 'usef12k') {
        const usef4kCheckbox = getCheckbox('usef4k');
        if (getCheckbox('usef12k').checked) {
            updateCheckboxState2(getCheckbox('usef12k'), usef4kCheckbox, true);
        } else {
            usef4kCheckbox.disabled = false;
        }
    } else if (checkboxId === 'closeimsc') {
        const closeimscCheckbox = getCheckbox('closeimsc');
        updateCheckboxState(getCheckbox('closeimsc'), getCheckbox('useimscn'), true);
    }
}

function toggleUsePrk(isEnabled) {
    const prkCheckbox = getCheckbox('useprk');
    if (!prkCheckbox) return;

    prkCheckbox.disabled = !isEnabled;
    if (!isEnabled) prkCheckbox.checked = false;
}

function save_options() {
    const options = {};
    checkboxIds.forEach((id) => {
        try {
            options[id] = getCheckboxState(id);
        } catch (error) {
            console.error(`Error getting state for checkbox with ID: ${id}`, error);
        }
    });

    chrome.storage.sync.set(options, () => {
        const shouldReload = confirm("Options saved. \r\nRefresh the player page now?");
        if (shouldReload) {
            chrome.tabs.query({ active: true, currentWindow: true }, () => {
                chrome.tabs.reload();
            });
        }
        window.close();
    });
}

function restore_options() {
    chrome.storage.sync.get(Object.fromEntries(checkboxIds.map(id => [id, false])), items => {
        checkboxIds.forEach(id => {
            const checkbox = getCheckbox(id);
            checkbox.checked = items[id];

            checkbox.addEventListener('change', () => {
                updateRelatedCheckboxes(id);
            });
        });

        toggleUsePrk(items['useAVC']);

        const radios = document.querySelectorAll('input[name="contact"]');
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                const useAVCChecked = getCheckbox('useAVC').checked;
                toggleUsePrk(useAVCChecked);
            });
        });

        updateRelatedCheckboxes('usef12k');
        updateRelatedCheckboxes('closeimsc');
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
