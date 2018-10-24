#!/bin/sh
#
# echo "SportsDrop Registration Successful" | mailx -a 'Content-Type: text/html' -s "SportsDrop Registration" "<email_address>" < "email-registration.html"
#
# send email message
# ------------------
echo "$1" | mailx -a "Content-Type: text/html" -s "$2" "$3" < "$4"

# echo "$@" > test.log
rm "$4" -f  2> /dev/null
