export interface WhatsappClient {
    sendMessage(to: string, message: string): Promise<void>;
    closeGroup(groupId: number): Promise<void>;
    openGroup(groupId: number): Promise<void>;
}