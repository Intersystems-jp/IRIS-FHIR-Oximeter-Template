$(document).ready(function () {
    const divPlist = document.querySelector('#patientlist');

    var objPatient = "";

    // Instantiate a new FHIR client
    var client = fhir({
        //baseUrl: '/fhir/r4',
        baseUrl: '/csp/healthshare/r4fhirnamespace/fhir/r4/',
        headers: {
            'Accept': 'application/fhir+json',
            'Content-Type': 'application/fhir+json;charset=utf-8',
            'Authorization': 'Basic ' + btoa('_SYSTEM:SYS')
        }
    });

    $("#reloadList").click(function () {
        location.reload();
    });

    $("#updateData").prop('disabled', true);

    $("#insertData").prop('disabled', false);

    $("#myRange").prop('disabled', true);

    function Toast(type, css, msg) {
        this.type = type;
        this.css = css;
        this.msg = msg;
    }

    var toasts = [
        new Toast('success', 'toast-bottom-center', '更新完了！'),
        new Toast('error', 'toast-bottom-center', '更新中にエラーが出ました。開発者モードでご確認ください'),
        new Toast('error', 'toast-bottom-center', '（Patientリソース）全項目入力してください')
    ];

    toastr.options.positionClass = 'toast-top-full-width';
    toastr.options.extendedTimeOut = 0; //1000;
    toastr.options.timeOut = 2000;
    toastr.options.fadeOut = 250;
    toastr.options.fadeIn = 250;

    function showToast(i) {
        var t = toasts[i];
        toastr.options.positionClass = t.css;
        toastr[t.type](t.msg);
    }

    $("#updateData").click(function () {
        $("#updateData").prop('disabled', true);
        updatePatient($("#fhirId").val());
    });

    $("#insertData").click(function () {
        $("#insertData").prop('disabled', true);
        insertPatient();
    });

    $("#clearData").click(function () {
        $("#updateData").prop('disabled', true);
        clearData();
    });

    var slider = document.getElementById("myRange");
    var output = document.getElementById("output");
    output.innerHTML = slider.value; // Display the default slider value

    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
        output.innerHTML = this.value;
    }
    

    function getName(r) {
        let name = '';
        if (r.name && r.name.length > 0) {
            if (r.name[0].family) {
                name += r.name[0].family;
            }
            if (r.name[0].given && r.name[0].given.length > 0) {
                name += `${r.name[0].given[0]} `;
            }
            if (r.name[1].family) {
                name += '(' + r.name[1].family;
            }
            if (r.name[1].given && r.name[1].given.length > 0) {
                name += `${r.name[1].given[0]})`;
            }
        }

        return name;
    }

    // Perform a search to retrieve patient details for a specific patient
    window.loadForm = function (patientId) {
        client.search({
                type: 'Patient',
                query: {
                    _id: patientId
                }
            }).then((res) => {
                const bundle = res.data;
                bundle.entry.forEach((patient) => {
                    console.log(patient.resource);
                    objPatient = patient;
                    $("#fhirId").val(patient.resource.id);
                    $("#MRN").val(patient.resource.identifier[0].value);
                    $("#firstName").val(patient.resource.name[0].given[0]);
                    $("#lastName").val(patient.resource.name[0].family);
                    $("#kanafirstName").val(patient.resource.name[1].given[0]);
                    $("#kanalastName").val(patient.resource.name[1].family);
                    $("#dateofbirth").val(patient.resource.birthDate);
                    $("#gender").val(patient.resource.gender);
                    $("#postalcode").val(patient.resource.address[0].postalCode);
                    $("#addresstext").val(patient.resource.address[0].text);

                    var textedJSON = JSON.stringify(patient.resource, undefined, 4);
                    $('#fhirdatasource').text(textedJSON);

                    $("#allergyTable tbody").empty();
                    $("#vitalSignsTable tbody").empty();
                    $("#laboratoryTable tbody").empty();
                    $("#immunizationTable tbody").empty();
                    $("#iconChart").empty();
                    $("#updateData").prop('disabled', false);
                    $("#insertData").prop('disabled', true);
                    $("#myRange").prop('disabled', false);

                    allergy(patient.resource.id);
                    vitalsigns(patient.resource.id);
                    laboratory(patient.resource.id);
                    immunization(patient.resource.id);
                });
            })
            .catch((err) => {
                // Error responses
                if (err.status) {
                    console.log(err);
                    console.log('Error', err.status);
                }
                // Errors
                if (err.data && err.data) {
                    console.log('Error', err.data);
                }
            });
    };

    // Perform a search to retrieve patient list
    client.search({
            type: 'Patient',
            query: {
                _sort: '-_lastUpdated'
            }
        }).then((res) => {
            const bundle = res.data;
            bundle.entry.forEach((patient) => {
                const patientId = patient.resource.id;
                const name = getName(patient.resource);
                const megaDIV = '<div id="' + patientId + '" class="list-group-item" data-toggle="sidebar" data-sidebar="show" onclick="loadForm(' + patientId + ')"><a href="#" class="stretched-link"></a><div class="list-group-item-figure"><div class="tile tile-circle bg-blue">' + name.slice(0, 1) + '</div></div><div class="list-group-item-body"><h4 class="list-group-item-title"> ' + name + '</h4><p class="list-group-item-text"> FHIR Patient ID: ' + patientId + ' </p></div></div>';
                $("#listgroup").append(megaDIV);
            });
        })
        .catch((err) => {
            // Error responses
            if (err.status) {
                console.log(err);
                console.log('Error', err.status);
            }
            // Errors
            if (err.data && err.data) {
                console.log('Error', err.data);
            }
        });


    // Perform a search to Immunization list for a specific patient
    window.immunization = function (patientId) {
        client.search({
                type: 'Immunization',
                query: {
                    patient: patientId
                }
            }).then((res) => {
                const bundle = res.data;
                $("#badgeImmunization").html(res.data.total);

                var resourceImmunization = JSON.stringify(bundle, undefined, 4);
                $('#fhirdatasource').append(resourceImmunization);

                bundle.entry.forEach((immunization) => {
                    const vaccineRow = '<tr><td>' + immunization.resource.vaccineCode["coding"][0].display + '</td><td>' + immunization.resource.occurrenceDateTime + '</td></tr>';
                    $("#immunizationTable tbody").append(vaccineRow);
                });
            })
            .catch((err) => {
                // Error responses
                if (err.status) {
                    console.log(err);
                    console.log('Error', err.status);
                }
                // Errors
                if (err.data && err.data) {
                    console.log('Error', err.data);
                }
            });
    };

    // Perform a search to Allergy list for a specific patient
    window.allergy = function (patientId) {
        client.search({
                type: 'AllergyIntolerance',
                query: {
                    patient: patientId
                }
            }).then((res) => {
                const bundle = res.data;
                $("#badgeAllergy").html(res.data.total);

                if (res.data.total > 0) {
                    var resourceAllergy = JSON.stringify(bundle, undefined, 4);
                    $('#fhirdatasource').append(resourceAllergy);

                    bundle.entry.forEach((allergy) => {
                        const allergyRow = '<tr><td>' + allergy.resource.code.coding[0].display + '</td><td>' + allergy.resource.type + '</td><td>' + allergy.resource.category[0] + '</td><td>' + allergy.resource.criticality + '</td></tr>';
                        $("#allergyTable tbody").append(allergyRow);
                    });
                }
            })
            .catch((err) => {
                // Error responses
                if (err.status) {
                    console.log(err);
                    console.log('Error', err.status);
                }
                // Errors
                if (err.data && err.data) {
                    console.log('Error', err.data);
                }
            });
    };

    // Perform a search to Vital Signs list for a specific patient
    window.vitalsigns = function (patientId) {
        client.search({
                type: 'Observation',
                query: {
                    patient: patientId,
                    category: 'vital-signs',
                    _sort: 'date'
                }
            }).then((res) => {
                const bundle = res.data;
                $("#badgeVitalSigns").html(res.data.total);

                var resourceVitalSigns = JSON.stringify(bundle, undefined, 4);
                $('#fhirdatasource').append(resourceVitalSigns);

                bundle.entry.forEach((vitalsigns) => {
                    if (vitalsigns.resource.hasOwnProperty('valueQuantity')) {
                        const vitalsignsRow = '<tr><td>' + vitalsigns.resource.code.coding[0].display + '</td><td>' + vitalsigns.resource.valueQuantity.value + '</td><td>' + vitalsigns.resource.valueQuantity.unit + '</td><td>' + vitalsigns.resource.effectiveDateTime + '</td></tr>';
                        $("#vitalSignsTable tbody").append(vitalsignsRow);
                    } else {
                        vitalsigns.resource.component.forEach((bp) => {
                            const vitalBpRow = '<tr><td>' + bp.code.text + '</td><td>' + bp.valueQuantity.value + '</td><td>' + bp.valueQuantity.unit + '</td><td>' + vitalsigns.resource.effectiveDateTime + '</td></tr>';
                            $("#vitalSignsTable tbody").append(vitalBpRow);
                        });
                    }
                });
            })
            .catch((err) => {
                // Error responses
                if (err.status) {
                    console.log(err);
                    console.log('Error', err.status);
                }
                // Errors
                if (err.data && err.data) {
                    console.log('Error', err.data);
                }
            });
    };

    window.laboratory = function (patientId) {
        client.search({
                type: 'Observation',
                query: {
                    patient: patientId,
                    category: 'laboratory',
                    _sort: 'date'
                }
            }).then((res) => {
                const bundle = res.data;
                $("#badgeLaboratory").html(res.data.total);

                if (res.data.total > 0) {
                    const icone = '<a target="_blank" href="labresult.html?id=' + patientId + '"><span class="label label-info"><i class="fas fa-chart-line"></i></span></a>';
                    $("#iconChart").append(icone);
                }

                var resourceLaboratory = JSON.stringify(bundle, undefined, 4);
                $('#fhirdatasource').append(resourceLaboratory);

                bundle.entry.forEach((laboratory) => {
                    const laboratoryRow = '<tr><td>' + laboratory.resource.code.coding[0].display + '</td><td>' + laboratory.resource.valueQuantity.value + '</td><td>' + laboratory.resource.valueQuantity.unit + '</td><td>' + laboratory.resource.effectiveDateTime + '</td></tr>';
                    $("#laboratoryTable tbody").append(laboratoryRow);
                });
            })
            .catch((err) => {
                // Error responses
                if (err.status) {
                    console.log(err);
                    console.log('Error', err.status);
                }
                // Errors
                if (err.data && err.data) {
                    console.log('Error', err.data);
                }
            });
    };

    window.updatePatient = function (patientId) {

        //入力チェック（全部必須）
        chk=checkVal();
        if (chk==1) {
            showToast(2);
            return;
        }

        objPatient.resource.id = $("#fhirId").val();
        objPatient.resource.identifier[0].value = $("#MRN").val();
        objPatient.resource.name[0].given[0] = $("#firstName").val();
        objPatient.resource.name[0].family = $("#lastName").val();
        objPatient.resource.name[1].given[0] = $("#kanafirstName").val();
        objPatient.resource.name[1].family = $("#kanalastName").val();
        objPatient.resource.birthDate = $("#dateofbirth").val();
        objPatient.resource.gender = $("#gender").val();
        objPatient.resource.address[0].postalCode = $("#postalcode").val();
        objPatient.resource.address[0].text = $("#addresstext").val();

        //console.log(objPatient.resource);

        bundle = {
            "resourceType": "Bundle",
            "type":"transaction",
            "entry": [
                {
                    "resource":{},
                    "request":{}
                }
            ]
        };
        observation={
        "resourceType": "Observation",
        "meta": {
            "profile": [
            "http://hl7.org/fhir/StructureDefinition/vitalsigns"
            ]
        },
        "text": {
            "status": "generated",
            "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: satO2</p><p><b>meta</b>: </p><p><b>identifier</b>: o1223435-10</p><p><b>partOf</b>: <a>Procedure/ob</a></p><p><b>status</b>: final</p><p><b>category</b>: Vital Signs <span>(Details : {http://terminology.hl7.org/CodeSystem/observation-category code 'vital-signs' = 'Vital Signs', given as 'Vital Signs'})</span></p><p><b>code</b>: Oxygen saturation in Arterial blood <span>(Details : {LOINC code '2708-6' = 'Oxygen saturation in Arterial blood', given as 'Oxygen saturation in Arterial blood'}; {LOINC code '59408-5' = 'Oxygen saturation in Arterial blood by Pulse oximetry', given as 'Oxygen saturation in Arterial blood by Pulse oximetry'}; {urn:iso:std:iso:11073:10101 code '150456' = '150456', given as 'MDC_PULS_OXIM_SAT_O2'})</span></p><p><b>subject</b>: <a>Patient/example</a></p><p><b>effective</b>: 05/12/2014 9:30:10 AM</p><p><b>value</b>: 95 %<span> (Details: UCUM code % = '%')</span></p><p><b>interpretation</b>: Normal (applies to non-numeric results) <span>(Details : {http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation code 'N' = 'Normal', given as 'Normal'})</span></p><p><b>device</b>: <a>DeviceMetric/example</a></p><h3>ReferenceRanges</h3><table><tr><td>-</td><td><b>Low</b></td><td><b>High</b></td></tr><tr><td>*</td><td>90 %<span> (Details: UCUM code % = '%')</span></td><td>99 %<span> (Details: UCUM code % = '%')</span></td></tr></table></div>"
        },
        "identifier": [
            {
            "system": "http://goodcare.org/observation/id",
            "value": "o1223435-10"
            }
        ],
        "partOf": [
            {
            "reference": "Procedure/ob"
            }
        ],
        "status": "final",
        "category": [
            {
            "coding": [
                {
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "vital-signs",
                "display": "Vital Signs"
                }
            ],
            "text": "Vital Signs"
            }
        ],
        "code": {
            "coding": [
            {
                "system": "http://loinc.org",
                "code": "2708-6",
                "display": "Oxygen saturation in Arterial blood"
            },
            {
                "system": "http://loinc.org",
                "code": "59408-5",
                "display": "Oxygen saturation in Arterial blood by Pulse oximetry"
            },
            {
                "system": "urn:iso:std:iso:11073:10101",
                "code": "150456",
                "display": "MDC_PULS_OXIM_SAT_O2"
            }
            ]
        },
        "subject": {
            "reference": "Patient/1"
        },
        "effectiveDateTime": "2014-12-05T09:30:10+01:00",
        "valueQuantity": {
            "value": "100",
            "unit": "%",
            "system": "http://unitsofmeasure.org",
            "code": "%"
        },
        "interpretation": [
            {
            "coding": [
                {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                "code": "N",
                "display": "Normal"
                }
            ],
            "text": "Normal (applies to non-numeric results)"
            }
        ],
        "device": {
            "reference": "DeviceMetric/example"
        },
        "referenceRange": [
            {
            "low": {
                "value": 90,
                "unit": "%",
                "system": "http://unitsofmeasure.org",
                "code": "%"
            },
            "high": {
                "value": 99,
                "unit": "%",
                "system": "http://unitsofmeasure.org",
                "code": "%"
            }
            }
        ]
        };
        //オキシメーターの値登録
        observation.valueQuantity.value = parseInt($("#myRange").val());
        //PatientリソースIDをセット
        observation.subject.reference="Patient/"+objPatient.resource.id
        //日付時刻設定
        const d = new Date(); // Today
        const DateTimeFormat = 'YYYY-MM-DDThh:mi:ss+09:00';
        let toFileName = DateTimeFormat
          .replace(/YYYY/g, String(d.getFullYear()))
          .replace(/MM/g, ('0' + (d.getMonth() + 1)).slice(-2))
          .replace(/DD/g, ('0' + d.getDate()).slice(-2))
          .replace(/hh/g, ('0' + d.getHours()).slice(-2))
          .replace(/mi/g, ('0' + d.getMinutes()).slice(-2))
          .replace(/ss/g, ('0' + d.getSeconds()).slice(-2));
        observation.effectiveDateTime=toFileName;

        bundle.entry[0].resource=objPatient.resource;
        req={};
        req.method="PUT";
        req.url="Patient/"+objPatient.resource.id;
        bundle.entry[0].request=req

        bundle.entry[1]={}
        bundle.entry[1].resource=observation;
        req={};
        req.method="POST";
        req.url="Observation";
        bundle.entry[1].request=req

        console.log(bundle);

        //client.update({
        client.transaction({
            type: "",
            //id: parseInt(patientId),
            resource: bundle
        }).catch(function (e) {
            showToast(1);
            $("#updateData").prop('disabled', false);
            throw e;
        }).then(function (bundle) {
            showToast(0);
            $("#updateData").prop('disabled', false);

            return bundle;
        });
    };


    window.clearData = function () {
        $("#form1")
            .find("input, select")
            .not(":button, :submit, :reset, :hidden")
            .val("")
            .prop("checked", false)
            .prop("selected", false)
        ;
    };

    window.insertPatient = function () {
        //入力チェック（全部必須）
        chk=checkVal();
        if (chk==1) {
            showToast(2);
            return;
        }
        objPatient={
            "resourceType": "Patient",
            "address": [
                {
                    "postalCode": "",
                    "text": ""
                }
            ],
            "birthDate": "",
            "gender": "",
            "identifier": [
                {
                    "value": ""
                }
            ],
            "name": [
                {
                    "extension": [
                        {
                            "url": "http://hl7.org/fhir/StructureDefinition/iso21090-EN-representation",
                            "valueCode": "IDE"
                        }
                    ],
                    "use": "official",
                    "text": "",
                    "family": "",
                    "given": [
                        ""
                    ]
                },
                {
                    "extension": [
                        {
                            "url": "http://hl7.org/fhir/StructureDefinition/iso21090-EN-representation",
                            "valueCode": "SYL"
                        }
                    ],
                    "use": "official",
                    "text": "",
                    "family": "",
                    "given": [
                        ""
                    ]
                }
            ],
        };
        
        objPatient.identifier[0].value = $("#MRN").val();
        objPatient.name[0].given[0] = $("#firstName").val();
        objPatient.name[0].family = $("#lastName").val();
        objPatient.name[0].text= $("#lastName").val() + " "+$("#firstName").val()
        objPatient.name[1].given[0] = $("#kanafirstName").val();
        objPatient.name[1].family = $("#kanalastName").val();
        objPatient.name[1].text= $("#kanalastName").val() + " "+$("#kanafirstName").val()
        objPatient.birthDate = $("#dateofbirth").val();
        objPatient.gender = $("#gender").val();
        objPatient.address[0].postalCode = $("#postalcode").val();
        objPatient.address[0].text = $("#addresstext").val();
        
        console.log(objPatient);

        client.create({
            type: "Patient",
            resource: objPatient
        }).catch(function (e) {
            showToast(1);
            $("#insertData").prop('disabled', false);
            throw e;
        }).then(function (bundle) {
            showToast(0);
            $("#insertData").prop('disabled', false);

            return bundle;
        });
    };

    window.checkVal = function () {
        var flag=0;
        if ($("#MRN").val()=="") {
            flag=1;
        };
        if ($("#firstName").val()=="") {
            flag=1;
        }
        if ($("#lastName").val()=="") {
            flag=1;
        }
        if ($("#kanafirstName").val()=="") {
            flag=1;
        }
        if ($("#kanalastName").val()=="") {
            flag=1;
        }
        if ($("#dateofbirth").val()=="") {
            flag=1;
        }
        if ($("#gender").val()=="") {
            flag=1;
        }
        if ($("#postalcode").val()=="") {
            flag=1;
        }
        if ($("#addresstext").val()=="") {
            flag=1;
        }
        return flag;
    };    
});
