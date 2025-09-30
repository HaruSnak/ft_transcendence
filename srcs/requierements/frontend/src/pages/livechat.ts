/* eslint-disable no-undef */
import { socket, sendMessageToBackend } from '../socket.js';

type Message = { from: string; text: string };
type ChatHistory = { [channel: string]: Message[] };

// Constants for DOM selectors
const SELECTORS = {
  GENERAL_BTN: 'btn-general',
  DM_LIST: 'dm-list',
  USER_LIST: 'user-list',
  CHAT_TITLE: 'chat-title',
  BLOCK_BTN: 'block-btn',
  INVITE_BTN: 'invite-btn',
  CHAT_MESSAGES: 'chat_messages',
  CHAT_FORM: 'chat_form',
  CHAT_INPUT: 'chat_input',
} as const;

const GENERAL_CHANNEL = '';
const BLOCKED_USERS_KEY = 'blockedUsers';

class ChatManager {
  private history: ChatHistory = {};
  private currentChannel = GENERAL_CHANNEL;
  private username = '';
  private blockedUsers = new Set<string>();

  // DOM elements
  private generalBtn!: HTMLButtonElement;
  private dmList!: HTMLDivElement;
  private userList!: HTMLDivElement;
  private titleElem!: HTMLSpanElement;
  private blockBtn!: HTMLButtonElement;
  private inviteBtn!: HTMLButtonElement;
  private chatbox!: HTMLDivElement;
  private form!: HTMLFormElement;
  private input!: HTMLInputElement;

  async init() {
    await this.connectSocket();
    this.initializeElements();
    this.loadBlockedUsers();
    await this.loadUsername();
    this.registerUser();
    this.setupEventListeners();
    this.handleInitialDMTarget();
  }

  private async connectSocket() {
    await socket.connect();
  }

  private initializeElements() {
    this.generalBtn = document.getElementById(SELECTORS.GENERAL_BTN) as HTMLButtonElement;
    this.dmList = document.getElementById(SELECTORS.DM_LIST) as HTMLDivElement;
    this.userList = document.getElementById(SELECTORS.USER_LIST) as HTMLDivElement;
    this.titleElem = document.getElementById(SELECTORS.CHAT_TITLE) as HTMLSpanElement;
    this.blockBtn = document.getElementById(SELECTORS.BLOCK_BTN) as HTMLButtonElement;
    this.inviteBtn = document.getElementById(SELECTORS.INVITE_BTN) as HTMLButtonElement;
    this.chatbox = document.getElementById(SELECTORS.CHAT_MESSAGES) as HTMLDivElement;
    this.form = document.getElementById(SELECTORS.CHAT_FORM) as HTMLFormElement;
    this.input = document.getElementById(SELECTORS.CHAT_INPUT) as HTMLInputElement;

    this.history[GENERAL_CHANNEL] = [];
  }

  private loadBlockedUsers() {
    const blocked = JSON.parse(localStorage.getItem(BLOCKED_USERS_KEY) || '[]');
    this.blockedUsers = new Set(blocked);
  }

  private saveBlockedUsers() {
    localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify([...this.blockedUsers]));
  }

  private async loadUsername() {
    this.username = await getCurrentUsername();
  }

  private registerUser() {
    socket.emit('register', { username: this.username });
  }

  private setupEventListeners() {
    this.setupBlockButton();
    this.setupInviteButton();
    this.setupMessageForm();
    this.setupBackendMessageListener();
    this.setupUserListListener();
    this.setupGeneralButton();
  }

  private setupBlockButton() {
    this.blockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleBlockUser();
    });
  }

  private setupInviteButton() {
    this.inviteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.inviteToGame();
    });
  }

  private setupMessageForm() {
    this.form.onsubmit = (e) => {
      e.preventDefault();
      this.sendMessage();
    };
  }

  private setupBackendMessageListener() {
    window.addEventListener('message_backend_to_frontend', (event) => {
      const { from, to, text } = (event as CustomEvent).detail;
      this.receiveMessage(from, to, text);
    });
  }

  private setupUserListListener() {
    window.addEventListener('user_list', (event) => {
      const users = (event as CustomEvent).detail;
      this.updateUserList(users);
    });
  }

  private setupGeneralButton() {
    this.generalBtn.onclick = () => this.switchToChannel(GENERAL_CHANNEL);
  }

  private toggleBlockUser() {
    if (this.blockedUsers.has(this.currentChannel)) {
      this.blockedUsers.delete(this.currentChannel);
      console.log(`✅ Unblocked: ${this.currentChannel}`);
    } else {
      this.blockedUsers.add(this.currentChannel);
      console.log(`🚫 Blocked: ${this.currentChannel}`);
    }
    this.saveBlockedUsers();
    this.render();
  }

  private inviteToGame() {
    console.log(`[DEBUG] Invite to game: ${this.currentChannel}`);
    localStorage.setItem('gameInvite', this.currentChannel);
    window.location.hash = '#game';
  }

  private sendMessage() {
    const text = this.input.value.trim();
    if (!text) return;

    sendMessageToBackend(this.currentChannel, text);
    if (this.currentChannel !== GENERAL_CHANNEL) {
      this.history[this.currentChannel].push({ from: this.username, text });
    }
    this.input.value = '';
    this.render();
  }

  private receiveMessage(from: string, to: string, text: string) {
    const targetChannel = to === GENERAL_CHANNEL ? GENERAL_CHANNEL : from;
    
    if (to !== GENERAL_CHANNEL) {
      this.createDMChannel(from);
    }
    
    if (!this.history[targetChannel]) {
      this.history[targetChannel] = [];
    }
    this.history[targetChannel].push({ from, text });
    if (targetChannel === this.currentChannel) {
      this.render();
    }
  }

  private updateUserList(users: string[]) {
    this.userList.innerHTML = '';
    for (const user of users) {
      if (user === this.username) continue;
      this.createUserElement(user);
    }
  }

  private createUserElement(user: string) {
    const userDiv = document.createElement('div');
    userDiv.className = 'p-2 hover:bg-gray-700 cursor-pointer rounded';
    userDiv.textContent = user;

    const chatBtn = document.createElement('span');
    chatBtn.textContent = '💬';
    userDiv.appendChild(chatBtn);

    chatBtn.onclick = (e) => {
      e.stopPropagation();
      this.createDMChannel(user);
      this.switchToChannel(user);
    };

    userDiv.onclick = () => {
      localStorage.setItem('dmTarget', user);
      window.location.hash = '#profile';
    };

    this.userList.appendChild(userDiv);
  }

  private handleInitialDMTarget() {
    const target = localStorage.getItem('dmTarget');
    if (target) {
      localStorage.removeItem('dmTarget');
      this.ensureDMChannelExists(target);
      this.switchToChannel(target);
    } else {
      this.render();
    }
  }

  private ensureDMChannelExists(user: string) {
    if (!Array.from(this.dmList.children).some(child => child.textContent === user)) {
      this.createDMChannel(user);
    }
  }

  private createDMChannel(user: string) {
    if (this.dmList.querySelector(`#dm-tab-${user}`)) return;

    const tab = document.createElement('div');
    tab.className = 'p-2 hover:bg-gray-700 cursor-pointer rounded';
    tab.id = `dm-tab-${user}`;
    tab.textContent = user;
    tab.onclick = () => this.switchToChannel(user);

    this.dmList.appendChild(tab);
    this.history[user] = [];
  }

  private switchToChannel(channel: string) {
    this.currentChannel = channel;
    this.render();
  }

  private render() {
    this.updateTitle();
    this.updateButtonVisibility();
    this.renderMessages();
    this.updateTabHighlights();
  }

  private updateTitle() {
    this.titleElem.textContent = this.currentChannel === GENERAL_CHANNEL
      ? '# general'
      : `@ ${this.currentChannel}`;
  }

  private updateButtonVisibility() {
    const isGeneral = this.currentChannel === GENERAL_CHANNEL;
    const isBlocked = this.blockedUsers.has(this.currentChannel);

    this.blockBtn.style.display = isGeneral ? 'none' : 'inline-block';
    this.blockBtn.textContent = isBlocked ? 'Unblock user' : 'Block user';

    this.inviteBtn.style.display = (isGeneral || isBlocked) ? 'none' : 'inline-block';
  }

  private renderMessages() {
    this.chatbox.innerHTML = '';
    const messages = this.history[this.currentChannel] || [];

    for (const message of messages) {
      if (this.blockedUsers.has(message.from)) continue;

      const messageDiv = document.createElement('div');
      messageDiv.className = message.from === this.username
        ? 'self-end bg-blue-500 text-white p-2 rounded'
        : 'self-start bg-gray-800 text-gray-100 p-2 rounded';
      messageDiv.innerHTML = `<strong>${message.from}:</strong> ${message.text}`;
      this.chatbox.appendChild(messageDiv);
    }

    this.chatbox.scrollTop = this.chatbox.scrollHeight;
  }

  private updateTabHighlights() {
    this.generalBtn.classList.toggle('bg-blue-500', this.currentChannel === GENERAL_CHANNEL);
    this.generalBtn.classList.toggle('bg-gray-700', this.currentChannel !== GENERAL_CHANNEL);

    for (const child of Array.from(this.dmList.children)) {
      child.classList.toggle('bg-gray-700', child.textContent === this.currentChannel);
    }
  }
}

async function getCurrentUsername(): Promise<string> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return socket.id || '';

    // Decode token for fallback
    let usernameFromToken = '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      usernameFromToken = payload.username || '';
    } catch (decodeError) {
      console.log('Token decode error:', decodeError);
    }

    const response = await fetch('http://localhost:3003/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      console.log('API failed, using token username');
      return usernameFromToken || socket.id || '';
    }

    const data = await response.json();
    return data.user.username;
  } catch (error) {
    console.log('Username fetch error:', error);
    return socket.id || '';
  }
}

export async function initChatPage() {
  const chatManager = new ChatManager();
  await chatManager.init();
}
