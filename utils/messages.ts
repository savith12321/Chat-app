import moment from "moment"

function formatMessage(username : string, text : string, isAdmin : boolean) {
  return {
    username,
    text,
    time: moment().format('h:mm a'),
    isAdmin
  };
}

export {formatMessage};