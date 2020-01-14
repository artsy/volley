FROM node:10-alpine

WORKDIR /app

# Install dumb-init
# Set up deploy user
RUN apk --no-cache --quiet add \
    dumb-init && \
    adduser -D -g '' deploy

# Set up node modules
COPY package.json yarn.lock ./
RUN yarn install && yarn cache clean

# Finally, add the rest of our app's code
# (this is done at the end so that changes to our app's code
# don't bust Docker's cache)
COPY . ./
RUN chown -R deploy:deploy ./

# Switch to deploy user
USER deploy

ENV PORT 8080
EXPOSE 8080

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
