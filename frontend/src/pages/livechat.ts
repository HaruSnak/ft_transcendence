/* eslint-disable no-undef */
import { socket, sendMessageToBackend } from '../socket.js';

type Message = { from: string; text: string };
type History = { [user: string]: Message[] };

const history: History = {};

export function initChatPage() {
  const btnGen = document.getElementById('btn-general')! as HTMLButtonElement;
  const dmList = document.getElementById('dm-list')! as HTMLDivElement;
  const userList = document.getElementById('user-list')! as HTMLDivElement;
  const titleElem = document.getElementById('chat-title')! as HTMLSpanElement;
  const blockBtn = document.getElementById('block-btn')! as HTMLButtonElement;
  const inviteBtn = document.getElementById('invite-btn')! as HTMLButtonElement;
  const chatbox = document.getElementById('chat_messages')! as HTMLDivElement;
  const form = document.getElementById('chat_form')! as HTMLFormElement;
  const input = document.getElementById('chat_input')! as HTMLInputElement;

  let current = '';
  history[current] = [];

  // TODO: Only before real users through login
  let username: string;
  setTimeout(() => username = socket.id, 1000);

  const blockedUsers = new Set<string>(JSON.parse(localStorage.getItem('blockedUsers') || '[]'));
  const saveBlocked = () => {
    localStorage.setItem('blockedUsers', JSON.stringify([...blockedUsers]));
  };

  blockBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    if (blockedUsers.has(current)) {
      blockedUsers.delete(current);
      console.log(`✅ Débloqué : ${current}`);
    } else {
      blockedUsers.add(current);
      console.log(`🚫 Bloqué : ${current}`);
    }
    saveBlocked();
    render();
  });

  inviteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log(`[DEBUG] inviteBtn click — invite -> ${current}`);
    localStorage.setItem('gameInvite', current);
    window.location.assign('/#game');
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text)
      return;
    sendMessageToBackend(current, text);
    if (current != '')
      history[current].push({ from: username, text });
    input.value = '';
    render();
  };

  window.addEventListener('message_backend_to_frontend', (event) => {
    const from = event.detail.from;
    const to = event.detail.to;
    const text = event.detail.text;
    let target;

    if (to == '') {
      target = '';
    }
    else {
      createDmTab(from);
      target = from;
    }

    history[target].push({ from, text });
    if (target === current)
      render();
  });

  window.addEventListener('user_list', (event) => {
    userList.innerHTML = '';
    for (const user of event.detail) {
      if (user == username) continue;
      const ul = document.createElement('div');
      ul.className = 'p-2 hover:bg-gray-700 cursor-pointer rounded';
      ul.textContent = user;
      //ul.innerHTML = `${user} <span>CHAT</span>`;
      const chatButton = document.createElement('span');
      chatButton.textContent = "💬";
      ul.appendChild(chatButton);
      chatButton.onclick = (e) => {
        e.stopPropagation();
        createDmTab(user);
        switchTo(user);
      };
      ul.onclick = () => {
        localStorage.setItem('dmTarget', user);
        window.location.hash = '#profile';
      };
      userList.appendChild(ul);
    }
  });

  btnGen.onclick = () => switchTo('');

  // ATTENTION : A REVOIR
  const target = localStorage.getItem('dmTarget');
  if (target) {
    localStorage.removeItem('dmTarget');
    if (![...dmList.children].some((c) => c.textContent === target)) {
      const tab = document.createElement('div');
      tab.className = 'p-2 hover:bg-gray-700 cursor-pointer rounded';
      tab.textContent = target;
      tab.onclick = () => switchTo(target);
      dmList.appendChild(tab);
    }
    switchTo(target);
  } else {
    render();
  }

  function createDmTab(name: string) {
    if (dmList.querySelector(`#dm-tab-${name}`)) return;
    const tab = document.createElement('div');
    tab.className = 'p-2 hover:bg-gray-700 cursor-pointer rounded';
    tab.id = `dm-tab-${name}`;
    tab.textContent = name;
    tab.onclick = () => switchTo(name);
    dmList.appendChild(tab);
    history[name] = [];
  }

  function switchTo(name: string) {
    current = name;
    render();
  }

  function render() {
    titleElem.textContent = (current === '') ? '# general' : `@ ${current}`;

    if (current === '') {
      blockBtn.style.display = 'none';
    } else {
      blockBtn.style.display = 'inline-block';
      blockBtn.textContent = blockedUsers.has(current) ? 'Unblock user' : 'Block user';
    }
    if (current === '' || blockedUsers.has(current)) {
      inviteBtn.style.display = 'none';
    } else {
      inviteBtn.style.display = 'inline-block';
    }

    chatbox.innerHTML = '';
    for (const message of (history[current] || [])) {
      if (blockedUsers.has(message.from))
        continue;
      const element = document.createElement('div');
      element.className =
        message.from === username
          ? 'self-end bg-blue-500 text-white p-2 rounded'
          : 'self-start bg-gray-800 text-gray-100 p-2 rounded';
      element.innerHTML = `<strong>${message.from}:</strong> ${message.text}`;
      chatbox.appendChild(element);
    }
    chatbox.scrollTop = chatbox.scrollHeight;

    btnGen.classList.toggle('bg-blue-500', current === '');
    btnGen.classList.toggle('bg-gray-700', current !== '')
    for (const child of dmList.children) {
      child.classList.toggle('bg-gray-700', child.textContent === current);
    }
  }
}
