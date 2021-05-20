# Start from alpine
FROM node:12.18-alpine

# Expose ports
ENV PORT 8080
EXPOSE 8080

# Install dumb-init
# Set up deploy user
RUN apk --no-cache --quiet add \
    dumb-init && \
    adduser -D -g '' deploy

WORKDIR /app
RUN chown deploy:deploy $(pwd)

# Switch to deploy user
USER deploy

# Set up node modules
COPY --chown=deploy:deploy package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

# Finally, add the rest of our app's code
# (this is done at the end so that changes to our app's code
# don't bust Docker's cache)
COPY --chown=deploy:deploy . ./

RUN yarn build

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
