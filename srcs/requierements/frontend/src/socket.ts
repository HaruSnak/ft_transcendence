class ChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, Function[]> = new Map();
  public id: string = '';

  constructor(private url: string) {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(`ws://localhost:3001/ws`);
      
      this.ws.onopen = () => {
        console.log('📡 WebSocket connecté');
        this.reconnectAttempts = 0;
        // Générer un ID temporaire
        this.id = 'user_' + Math.random().toString(36).substr(2, 9);
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📡 Message reçu:', data);
        
        // Émettre l'événement aux listeners
        this.triggerEvent(data.type || 'message', data);
        
        // Compatibility avec les anciens événements
        if (data.type === 'message') {
          window.dispatchEvent(new CustomEvent('message_backend_to_frontend', { detail: data }));
        } else if (data.type === 'user_list') {
          window.dispatchEvent(new CustomEvent('user_list', { detail: data.users }));
        }
      };

	this.ws.onclose = (event) => {
		console.log('📡 WebSocket fermé');
		console.log('Code de fermeture:', event.code);
		console.log('Raison:', event.reason);
		console.log('wasClean:', event.wasClean);
		this.handleReconnect();
	};

      this.ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
      };

    } catch (error) {
      console.error('❌ Impossible de se connecter:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => this.connect(), 2000);
    }
  }

  // Méthode Socket.IO compatible : emit
  public emit(event: string, data?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: event,
        ...data
      }));
    } else {
      console.warn('⚠️ WebSocket pas connecté');
    }
  }

  // Méthode Socket.IO compatible : on
  public on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  // Méthode pour déclencher les événements
  private triggerEvent(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Ancienne méthode pour compatibilité
  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket pas connecté');
    }
  }

  public close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Instance globale
export const socket = new ChatWebSocket('ws://localhost:3001/ws');

// Fonction utilitaire pour envoyer un message
export function sendMessageToBackend(to: string, text: string) {
  socket.emit('message', { to, text });
}