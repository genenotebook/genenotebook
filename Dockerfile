FROM ubuntu:18.10

RUN apt-get update -qq --fix-missing && apt-get clean

RUN apt-get install -y build-essential nodejs mongodb wget

RUN wget https://github.com/genenotebook/genenotebook/releases/download/v0.1.3/genenotebook_v0.1.3.tar.gz &&\
tar xvzf genenotebook_v0.1.3.tar.gz

RUN mongod &

WORKDIR genenotebook_v0.1.3

CMD ["./genenotebook","run"]