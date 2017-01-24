# barkochba

#Deploy
In order for you to deploy you need to be added to the Heroku team of this project

git clone git@github.com:szilveszterb/barkochba.git
cd barkochba
heroku login
git push heroku master

#See logs
heroku logs --tail

#Misc
heroku config:set FLASK_APP=src/server.py



