FROM node:latest

# Install packages
RUN apt-get update -qq && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set up deploy user
RUN adduser --disabled-password --gecos '' deploy

# Set up working directory
RUN mkdir /app

RUN npm install -g yarn

# Set up node modules
WORKDIR /tmp
ADD package.json package.json
ADD yarn.lock yarn.lock
RUN chmod u+x /usr/local/bin/yarn
RUN yarn install
RUN mv /tmp/node_modules /app/

# Finally, add the rest of our app's code
# (this is done at the end so that changes to our app's code
# don't bust Docker's cache)
ADD . /app
WORKDIR /app
RUN chown -R deploy:deploy /app

# Switch to deploy user
USER deploy
ENV USER deploy
ENV HOME /home/deploy

ENV PORT 8080
EXPOSE 8080

CMD node index.js
