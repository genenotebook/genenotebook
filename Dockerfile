FROM ubuntu:14.04
RUN mkdir /home/genebook
WORKDIR /home/genebook
ADD . ./genebook

RUN apt-get update -q && apt-get clean

RUN apt-get install curl -y \
 
  # Install Meteor
  && (curl https://install.meteor.com/ | sh) \
 
  # Build the Meteor app
  && cd /home/genebook/genebook \
  && meteor build --directory --server-only --allow-superuser ../build \
 
  # Install the version of Node.js we need.
  && cd /home/genebook/build/bundle \
  && bash -c 'curl "https://nodejs.org/dist/$(<.node_version.txt>) /home/genebook/genebook/build/required-node-linux-x64.tar.gz' \
  && cd /usr/local && tar --strip-components 1 -xzf /home/genebook/build/required-node-linux-x64.tar.gz \
  && rm /home/genebook/build/required-node-linux-x64.tar.gz \
 
  # Build the NPM packages needed for build
  && cd /home/genebook/build/bundle/programs/server \
  && npm install \
 
 
  # Get rid of Meteor. We're done with it.
  && rm /usr/local/bin/meteor \
  && rm -rf ~/.meteor \
 
  #no longer need curl
  && apt-get --purge autoremove curl -y

RUN npm install -g forever

EXPOSE 80
ENV PORT 80

CMD ["forever", "--minUptime", "1000", "--spinSleepTime", "1000", "genebook/build/bundle/main.js"]