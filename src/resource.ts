import { resolve } from 'path';
import { resourceUsage } from 'process';

const pool: {[id: string]: { 
    data: any;
} } = {};  

export function get<JSONType>(file: string) {
    return pool[file].data as JSONType;
}

export async function loadFile<JSONType>(file: string) {
    let json: JSONType;
    const promise = new Promise(resolve => {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
           json = JSON.parse(this.responseText);
           pool[file] = { data: json };
           resolve(json);
          }
        };
        xhttp.open('GET', file, true);
        xhttp.send();
    });
    return promise as Promise<JSONType>;
}