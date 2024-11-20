const doAction = async (action, payload) => {
  return fetch('/api/action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  }).then(v => v.json());
};

const removeAnsiCodes = text => {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, '');
};

const mapStringsToLines = arr => {
  return arr
    ?.map(text => {
      if (text === null || text === undefined) {
        return '';
      }
      return removeAnsiCodes(text);
    })
    .join('');
};

const saveLSState = ({ quizName, quizUrl, roundNumber }) => {
  localStorage.setItem('gwd.quizName', quizName);
  localStorage.setItem('gwd.quizUrl', quizUrl);
  localStorage.setItem('gwd.roundNumber', roundNumber);
};

const getLSState = () => {
  return {
    quizName: localStorage.getItem('gwd.quizName') || '',
    quizUrl: localStorage.getItem('gwd.quizUrl') || '',
    roundNumber: localStorage.getItem('gwd.roundNumber') || '',
  };
};

export const init = () => {
  window.addEventListener('load', () => {
    const copyButton = document.getElementById('button-copy');
    const copyCode = document.getElementById('code');
    const copyStatus = document.getElementById('copy-status');
    let timeoutId = null;

    copyButton.addEventListener('click', async () => {
      const text = copyCode.innerText;
      const result = navigator.clipboard.writeText(text.trim());
      console.log('Copied:', text, result);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      copyStatus.style.display = 'inline';
      timeoutId = setTimeout(() => {
        copyStatus.style.display = 'none';
        timeoutId = null;
      }, 1500);
    });

    const startScanButton = document.getElementById('button-start-scan');
    const scanStatusSpan = document.getElementById('scanning-status');
    const scanOutputTextarea = document.getElementById('scan-output');
    const scanResultsDiv = document.getElementById('scan-results');

    startScanButton.addEventListener('click', async () => {
      const { status, scanOutput } = await doAction('START_SCAN', {});
      console.log('status:', status);
      scanStatusSpan.innerText = status;
      scanOutputTextarea.value = mapStringsToLines(scanOutput);
      scanOutputTextarea.scrollTop = scanOutputTextarea.scrollHeight;

      if (status === 'STARTED') {
        const interval = setInterval(async () => {
          try {
            const { status, scanOutput, scanResults } = await doAction(
              'PING_SCAN',
              {}
            );
            scanStatusSpan.innerText = status;
            scanOutputTextarea.value = mapStringsToLines(scanOutput);
            scanOutputTextarea.scrollTop = scanOutputTextarea.scrollHeight;

            if (status === 'SCAN_COMPLETE') {
              console.log('SCAN COMPLETE:', scanResults);
              scanResultsDiv.innerHTML = scanResults
                .map(url => {
                  return `<a href="${url}">${url}</a><br/>`;
                })
                .join('');
              clearInterval(interval);
            }
          } catch (e) {
            console.error('Error:', e);
            clearInterval(interval);
          }
        }, 1000);
      } else {
        alert('Scan already started!');
      }
    });

    const saveButton = document.getElementById('button-save');
    const saveStatus = document.getElementById('saving-status');
    const saveOutputTextArea = document.getElementById('save-output');
    const quizNameInput = document.getElementById('input-quiz-name');
    const quizUrlInput = document.getElementById('input-quiz-url');
    const roundNumberInput = document.getElementById('input-round-number');

    saveButton.addEventListener('click', async () => {
      const quizName = quizNameInput.value;
      const quizUrl = quizUrlInput.value;
      const roundNumber = roundNumberInput.value;

      saveLSState({ quizName, quizUrl, roundNumber });

      if (!quizName) {
        alert('Quiz Name is required!');
        return;
      }
      if (!quizUrl) {
        alert('Quiz URL is required!');
        return;
      }
      if (!roundNumber) {
        alert('Round Number is required!');
        return;
      }

      const { status, saveOutput } = await doAction('SAVE_ROUND', {
        quizName,
        quizUrl,
        roundNumber,
      });
      console.log('status:', status);
      saveStatus.innerText = status;
      saveOutputTextArea.value = mapStringsToLines(saveOutput);
      saveOutputTextArea.scrollTop = saveOutputTextArea;

      if (status === 'STARTED') {
        const interval = setInterval(async () => {
          try {
            const { status, saveOutput } = await doAction('PING_SAVE', {});
            saveStatus.innerText = status;
            saveOutputTextArea.value = mapStringsToLines(saveOutput);
            saveOutputTextArea.scrollTop = saveOutputTextArea.scrollHeight;

            if (status === 'SAVE_COMPLETE') {
              console.log('SAVE COMPLETE');
              clearInterval(interval);
            }
          } catch (e) {
            console.error('Error:', e);
            clearInterval(interval);
          }
        }, 1000);
      }
    });

    quizNameInput.value = getLSState().quizName;
    quizUrlInput.value = getLSState().quizUrl;
    roundNumberInput.value = getLSState().roundNumber;

    console.log('GWD Quiz Getter App Loaded');
  });
};
