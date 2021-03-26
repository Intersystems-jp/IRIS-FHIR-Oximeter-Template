ARG IMAGE=store/intersystems/iris-community:2020.1.0.204.0
ARG IMAGE=intersystemsdc/iris-community:2020.1.0.209.0-zpm
ARG IMAGE=intersystemsdc/iris-community:2020.2.0.204.0-zpm
ARG IMAGE=intersystemsdc/iris-community:2020.3.0.200.0-zpm
ARG IMAGE=containers.intersystems.com/intersystems/irishealth:2020.3.0.221.0
ARG IMAGE=intersystemsdc/irishealth-community:2020.3.0.200.0-zpm
FROM $IMAGE

USER root

WORKDIR /opt/app
RUN chown ${ISC_PACKAGE_MGRUSER}:${ISC_PACKAGE_IRISGROUP} /opt/app
   
USER ${ISC_PACKAGE_MGRUSER}

COPY  Setup.cls .
COPY  src src
COPY  iris.script /tmp/iris.script

# run iris and initial 
RUN iris start IRIS \
    && iris session IRIS < /tmp/iris.script \
    && iris stop IRIS quietly \
    && cp /opt/app/src/portal/resources/js/myFHIR.js ${ISC_PACKAGE_INSTALLDIR}/csp/fhir/portal/resources/js/myFHIR.js \
    && cp /opt/app/src/portal/patientlist.html ${ISC_PACKAGE_INSTALLDIR}/csp/fhir/portal/patientlist.html
