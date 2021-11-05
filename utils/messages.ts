import moment from "moment"

function formatMessage(username : string, text : string, isAdmin : boolean , room: string) {
  return {
    username,
    text,
    time: moment().format('h:mm a'),
    isAdmin,
    room: room,
  };
}

export {formatMessage};