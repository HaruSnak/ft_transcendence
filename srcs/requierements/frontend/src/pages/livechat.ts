/* eslint-disable no-undef */
import { socket, sendMessageToBackend } from '../socket.js';

type Message = { from: string; text: string };
type History = { [user: string]: Message[] };

const history: History = {};

async function getCurrentUsername(): Promise<string> {
  try {
    const token = localStorage.getItem('authToken');
    console.log('Token:', token ? 'present' : 'null');
    if (!token) return socket.id || '';

    // Decode token to get username as fallback
    let usernameFromToken = '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      usernameFromToken = payload.username || '';
    } catch (decodeError) {
      console.log('Error decoding token:', decodeError);
    }

    const res = await fetch('http://localhost:3003/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Fetch status:', res.status);
    if (!res.ok) {
      console.log('API failed, using token username:', usernameFromToken);
      return usernameFromToken || socket.id || '';
    }

    const data = await res.json();
    console.log('Username from API:', data.user.username);
    return data.user.username;
  } catch (error) {
    console.log('Error fetching username:', error);
    return socket.id || '';
  }
}

export async function initChatPage() {
  // Connect socket only when entering chat
  await socket.connect();
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

  // Récupère le display name depuis la DB
  let username: string = '';
  username = await getCurrentUsername();

  // Envoie le display name au backend
  socket.emit('register', { username });

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
	interface CustomEventDetail {
	from: string;
	to: string;
	text: string;
	}

	interface UserListDetail {
	detail: any[];
	}

	// Dans votre fonction :
	const customEvent = event as CustomEvent<CustomEventDetail>;
	const from = customEvent.detail.from;
	const to = customEvent.detail.to;
	const text = customEvent.detail.text;
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
	const userListEvent = event as CustomEvent<any[]>;
	for (const user of userListEvent.detail) {
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
    if (!Array.from(dmList.children).some((c) => c.textContent === target)) {
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
    for (const child of Array.from(dmList.children)) {
      child.classList.toggle('bg-gray-700', child.textContent === current);
    }
  }
}
