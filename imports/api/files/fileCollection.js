import { FilesCollection } from 'meteor/ostrio:files';
import SimpleSchema from 'simpl-schema';

const MAX_FILE_SIZE = 1073741824; // 1GB

const fileCollection = new FilesCollection({
  collectionName: 'genomeFiles',
  // allowClientCode: false,
  disableDownload: true,
  onbeforeunloadMessage() {
    return 'Upload in progress, upload will be aborted if you leave this page!';
  },
  onBeforeUpload(file) {
    // console.log(`Uploading ${file}`);
    if (file.size <= MAX_FILE_SIZE) {
      return true;
    }
    return 'Please upload files smaller than 1GB';
  },
});

const fileSchema = new SimpleSchema(fileCollection.schema);

fileCollection.collection.attachSchema(fileSchema);

export { fileCollection, fileSchema };
