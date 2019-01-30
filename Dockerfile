FROM node:10-alpine

# Set up deploy user
RUN adduser -D -g '' deploy

# Set up working directory
RUN mkdir -p /app
RUN chown deploy:deploy /app

RUN npm install -g yarn

# Set up node modules
WORKDIR /tmp
ADD package.json package.json
ADD yarn.lock yarn.lock
RUN chmod u+x /usr/local/bin/yarn
RUN yarn install && yarn cache clean
RUN mv /tmp/node_modules /app/

# Finally, add the rest of our app's code
# (this is done at the end so that changes to our app's code
# don't bust Docker's cache)
WORKDIR /app
ADD --chown=deploy:deploy . /app

# Switch to deploy user
USER deploy
ENV USER deploy
ENV HOME /home/deploy

ENV PORT 8080
EXPOSE 8080

CMD node index.js
