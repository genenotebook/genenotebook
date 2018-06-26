echo "adding test transcriptome data" &&\
	node scripts/add_transcriptome.js -u admin -p admin -t test -s SRR1377076 -r "Root ACN" -e "MYC" -d "description" testdata/testdata.SRR1377076.abundance.tsv &&\
	node scripts/add_transcriptome.js -u admin -p admin -t test -s SRR1377077 -r "Root ACN" -e "MYC" -d "description" testdata/testdata.SRR1377077.abundance.tsv &&\
	node scripts/add_transcriptome.js -u admin -p admin -t test -s SRR1377078 -r "Root ACN" -e "MYC" -d "description" testdata/testdata.SRR1377078.abundance.tsv &&\
	node scripts/add_transcriptome.js -u admin -p admin -t test -s SRR1377079 -r "Root myc LCO (s)" -e "MYC" -d "description" testdata/testdata.SRR1377079.abundance.tsv &&\
	node scripts/add_transcriptome.js -u admin -p admin -t test -s SRR1377080 -r "Root myc LCO (s)" -e "MYC" -d "description" testdata/testdata.SRR1377080.abundance.tsv &&\
	node scripts/add_transcriptome.js -u admin -p admin -t test -s SRR1377081 -r "Root myc LCO (s)" -e "MYC" -d "description" testdata/testdata.SRR1377081.abundance.tsv &&\
	node scripts/add_transcriptome.js -u admin -p admin -t test -s SRR1523070 -r "Leaf and root" -e "Leaf and root" -d "description" testdata/testdata.SRR1523070.abundance.tsv &&\
	node scripts/add_transcriptome.js -u admin -p admin -t test -s SRR1523071 -r "Leaf and root" -e "Leaf and root" -d "description" testdata/testdata.SRR1523071.abundance.tsv &&\
	node scripts/add_transcriptome.js -u admin -p admin -t test -s SRR1523072 -r "Leaf and root" -e "Leaf and root" -d "description" testdata/testdata.SRR1523072.abundance.tsv &&\
	node scripts/add_transcriptome.js -u admin -p admin -t test -s SRR1523075 -r "Leaf and root" -e "Leaf and root" -d "description" testdata/testdata.SRR1523075.abundance.tsv