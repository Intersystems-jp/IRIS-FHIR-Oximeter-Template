#ARG IMAGE=intersystemsdc/irishealth-community:2021.1.0.215.3-zpm
ARG IMAGE=intersystemsdc/irishealth-community:2023.1.0.229.0-zpm
FROM $IMAGE

USER root

WORKDIR /opt/app
RUN chown ${ISC_PACKAGE_MGRUSER}:${ISC_PACKAGE_IRISGROUP} /opt/app
   
USER ${ISC_PACKAGE_MGRUSER}

COPY  Setup.cls .
COPY  src src
COPY  iris.script .

# run iris and initial 
RUN iris start IRIS \
    && iris session IRIS < iris.script \
    && iris stop IRIS quietly \
    && cp /opt/app/src/portal/resources/js/myFHIR.js ${ISC_PACKAGE_INSTALLDIR}/csp/fhir/portal/resources/js/myFHIR.js \
    && cp /opt/app/src/portal/patientlist.html ${ISC_PACKAGE_INSTALLDIR}/csp/fhir/portal/patientlist.html
