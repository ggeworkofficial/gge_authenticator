export interface Observer {
    update(data: any): Promise<void>;
}