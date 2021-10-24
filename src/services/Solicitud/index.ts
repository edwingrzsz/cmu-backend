import { Solicitud, SolicitudReq } from '@types';
import { pg } from 'db/connect';
const mongoid = require('mongoid-js')


class SolicitudService {

    createSolicitud(data: SolicitudReq): Promise<Solicitud> {
        var text: string
        let id = mongoid()
        var values: any[];
        const { ubicacion, causas, solicitante, nombre_solicitante } = data
        const { fecha, id_alumno } = data;
        if (solicitante) {
            text = 'INSERT INTO df.solicitud_medica(id_solicitud,ubicacion,causa,solicitante,nombre_solicitante,id_medico,fecha,id_alumno)VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *';
            values = [id, ubicacion, causas, solicitante, nombre_solicitante, '', fecha, id_alumno]
        } else {
            text = 'INSERT INTO df.solicitud_medica(id_solicitud,ubicacion,causa,solicitante,nombre_solicitante,id_medico,fecha,id_alumno)VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *';
            values = [id, ubicacion, causas, solicitante, null, '', fecha, id_alumno]
        }

        return new Promise((resolve, reject) => {
            pg.query(text, values, function (err, result) {
                if (err) reject(err)
                resolve(result.rows[0]);
            })
        });
    }//si
    async getAll() {
        const result = await this.getAllSolicitudesAtendidas();
        const resNo = await this.getSolicitudesNoAtendidas()
        return result.concat(resNo);
    }
    private getSolicitudesNoAtendidas(): Promise<Solicitud[]> {
        const fields = "id_solicitud,ubicacion,causa,estado,nombre_solicitante,CONCAT(u.nombre,' ',u.a_paterno,' ',u.a_materno) AS alumno";
        const text = `SELECT ${fields} FROM df.solicitud_medica s JOIN df.users u ON s.id_alumno=u.id_usuario WHERE s.estado=false`
        return new Promise((resolve, reject) => {
            pg.query(text, function (err, result) {
                console.log(err)
                if (err) reject(err);
                resolve(result.rows)
            });
        });
    }
    private getAllSolicitudesAtendidas(): Promise<Solicitud[]> {
        const fields = "id_solicitud,ubicacion,causa,estado,nombre_solicitante,CONCAT(a.nombre,' ',a.a_paterno,' ',a.a_materno) AS alumno, CONCAT(e.nombre,' ',e.a_paterno,' ',e.a_materno) AS enfermero,e.url img_enfermero";
        let text = `SELECT ${fields} FROM df.solicitud_medica s JOIN df.users a ON s.id_alumno=a.id_usuario JOIN df.users e ON s.id_medico=e.id_usuario WHERE s.estado=true`;
        return new Promise((resolve, reject) => {
            pg.query(text, function (err, result) {
                if (err) reject(err);
                resolve(result.rows)
            });
        });
    }

    getSolicitudEnfermero(enfermero: string): Promise<Solicitud[]> {
        const text = "SELECT * FROM df.solicitud_medica WHERE id_medico=$1";
        return new Promise((resolve, reject) => {
            pg.query(text, [enfermero], function (err, result) {
                if (err) reject(err);
                resolve(result.rows)
            });
        })
    }

    getSolicitudAlumno(alumno: string): Promise<Solicitud[]> {
        const text = "SELECT * FROM df.solicitud_medica WHERE id_alumno=$1";
        return new Promise((resolve, reject) => {
            pg.query(text, [alumno], function (err, result) {
                if (err) reject(err)
                resolve(result.rows)
            })
        })
    }

    atendidaUpdate(enfermeroid: string, idSolicitud: string): Promise<Solicitud> {
        const text = "UPDATE df.solicitud_medica SET estado=$1,id_medico=$2 WHERE id_solicitud=$3 RETURNING *";
        const values = [true, enfermeroid, idSolicitud];

        return new Promise((resolve, reject) => {
            pg.query(text, values, function (err, result) {
                if (err) reject(err);
                resolve(result.rows[0])
            });
        });
    }
    
}

export default new SolicitudService();