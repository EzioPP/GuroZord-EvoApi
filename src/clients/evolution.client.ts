import { WhatsappClient } from "./whatsapp.client";

export class EvolutionClient implements WhatsappClient {
    async sendMessage(to: string, message: string): Promise<void> {
        // Implement the logic to send a message via Evolution API
        console.log(`Sending message to ${to}: ${message}`);
    }
    
    async closeGroup(groupId: number): Promise<void> {
        // Implement the logic to close a group via Evolution API
        console.log(`Closing group with ID: ${groupId}`);
    }

    async openGroup(groupId: number): Promise<void> {
        // Implement the logic to open a group via Evolution API
        console.log(`Opening group with ID: ${groupId}`);
    }
}