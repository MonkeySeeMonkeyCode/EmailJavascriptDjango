document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));

  document.querySelector('#compose-form').addEventListener('submit', () => send_mail());
  
  
  // By default, load the inbox
  load_mailbox('inbox');

});

function send_mail() {
  const recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipient,
      subject: subject,
      body: body,
    })
  });
  return false;
};

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#email-content').innerHTML = '';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const element = document.createElement('div');
      if (!email.read) {
        element.id = 'email-white';
      } else {
        element.id = 'email-gray';
      }
      element.innerHTML = `<div id=sender>${email.sender}</div><div id=subject>${email.subject}</div><div id=timestamp>${email.timestamp}</div>`;
      element.addEventListener('click', () => view_email(email.id));
      document.querySelector('#emails-view').append(element);
    });
    // ... do something else with emails ...
  });

};


function view_email(email_id) {
  fetch(`emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-content').style.display = 'block';

    const header_element= document.createElement('div');
    header_element.id = 'email_header';
    header_element.innerHTML = `<b>From: </b>${email.sender}<br>`;
    header_element.innerHTML += `<b>To: </b>${email.recipients}<br>`;
    header_element.innerHTML += `<b>Subject: </b>${email.subject}<br>`;
    header_element.innerHTML += `<b>Timestamp: </b>${email.timestamp}<br>`;
    document.querySelector('#email-content').appendChild(header_element);

    const body_element = document.createElement('div');
    body_element.id = 'email_body';
    body_element.innerHTML += `<hr>`;
    body_element.innerHTML += email.body;
    document.querySelector('#email_header').appendChild(body_element);

    const reply_button = document.createElement('button');
    reply_button.id = 'reply_button';
    reply_button.innerHTML = `Reply`;
    reply_button.addEventListener('click', () => {
      compose_email(email.sender,email.subject,email.body,email.timestamp);
    });
    var child = document.querySelector('#email_body')
    document.querySelector('#email_header').insertBefore(reply_button,child);

    if (email.archived) {
      const unarchive_button = document.createElement('button');
      unarchive_button.id = 'unarchive_button';
      unarchive_button.innerHTML = 'Unarchive';
      unarchive_button.addEventListener('click', () => {
        fetch(`emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: false,
          })
        })
        .then(() => load_mailbox('archive'));
      });
      var child = document.querySelector('#email_body');
      document.querySelector('#email_header').insertBefore(unarchive_button,child);
    } else {
      const archive_button = document.createElement('button');
      archive_button.id = 'archive_button';
      archive_button.innerHTML = 'Archive';
      document.querySelector('#emails-view').innerHTML = '';
      archive_button.addEventListener('click', () => {
        fetch(`emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: true,
          })
        })
        .then(() => load_mailbox('inbox'));
      });
      var child = document.querySelector('#email_body');
      document.querySelector('#email_header').insertBefore(archive_button,child);
    }

    fetch(`emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true,
      })
    });
  });
};

function compose_email(sender,subject,body,timestamp) {
  if (subject) {
    subject = 'Re: ' + subject;
    body = '\n\nOn ' + timestamp + ' ' + sender + ' wrote: \n\n' + body;
  } else {
    sender = '';
    subject = '';
    body = '';
  }

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#email-content').innerHTML ='';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields

  document.querySelector('#compose-recipients').value = sender;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}