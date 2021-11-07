function formatMessage(username : string, text : string, time: string, isAdmin : boolean , room: string, isBot: boolean, id: any) {
  return {
    username,
    text,
    time,
    isAdmin,
    room: room,
    isBot,
    id: id.length + 1, 
  };
}

export {formatMessage};