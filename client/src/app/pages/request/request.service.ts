import { Injectable } from '@angular/core';
import ApiSchema from "../../doc-config/schema.json";
import {Knob} from "../../doc-config/knobs/Knob";

@Injectable({
    providedIn: 'root',
})
export class RequestService {
    /** Reading from the JSON schema found in the doc-service-config folder, creates a displayable response object. */
    parseDtoSchema(dtoType: string): object {

        if (dtoType === 'string[]') {
            return { array: 'string' };
        }

        let isArray = false;
        if (dtoType && dtoType.includes('[]')) {
            isArray = true;
            dtoType = dtoType.split('[]')[0];
        }
        if (!ApiSchema || !ApiSchema.definitions || !ApiSchema.definitions[dtoType]) {
            return;
        }
        const responseType = {};
        const properties = ApiSchema.definitions[dtoType].properties;
        const requiredPropsL1 = ApiSchema.definitions[dtoType].required;

        // TODO: this needs to support multiple levels of props, maybe 4 deep.  Think recursive.
        for (const propL1 in properties) {
            const attributeL1 = `${propL1}${requiredPropsL1.includes(propL1) ? '' : '?'}`;
            responseType[attributeL1] = properties[propL1].type;
            if (properties[propL1].properties) {
                responseType[attributeL1] = {};
            }
            const requiredPropsL2 = properties[propL1].required;
            for (const propL2 in properties[propL1].properties) {
                const attributeL2 = `${propL2}${(requiredPropsL2 || []).includes(propL2) ? '' : '?'}`;
                responseType[attributeL1][attributeL2] = properties[propL1].properties[propL2].type;
            }
        }
        return isArray ? { array: responseType } : responseType;
    }

    /** Given a list of Knobs, creates an object that represents a POST request body. */
    createRequestBody(requestKnobs: Knob[]): object {
        const body = {};
        for (const param of requestKnobs) {
            if (
                param.value === undefined ||
                (param.value === true && param.defaultValue === true) ||
                (param.value === false && (param.defaultValue === undefined || param.defaultValue === false)) ||
                (param.value === '' && (param.defaultValue === undefined || param.defaultValue === ''))
            ) {
                continue;
            }
            if (param.propertyType === 'array') {
                body[param.propertyName] = param.value.split(',');
            } else {
                body[param.propertyName] = param.value;
            }
        }
        return body;
    }

    /** Sometimes requests have variables directly in the URL.
     *  Given a list of knobs and a request path, dynamically creates the url a user would have to send.
     */
    getDynamicPath(knobs: Knob[], defaultPath: string): string {
        let dynamicPath = defaultPath;
        knobs.map((knob) => {
            if (knob.value) {
                dynamicPath = dynamicPath.replace(knob.restPathAlias, knob.value);
            }
        });
        return dynamicPath;
    }
}

