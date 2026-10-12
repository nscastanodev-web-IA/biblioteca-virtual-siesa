Crea una aplicación web responsive llamada “Biblioteca Virtual Siesa”, orientada a clientes que necesitan consultar y solicitar documentos relacionados con los sistemas y soluciones de la compañía.

La aplicación debe tener una experiencia moderna, corporativa, intuitiva y fácil de usar. Todo el contenido y las interfaces deben estar en español.

OBJETIVO DE LA APLICACIÓN

La aplicación permitirá que los clientes:

1. Consulten comunicados y manuales disponibles.
2. Busquen documentos por palabra clave.
3. Filtren los documentos por sistema, aplicativo, versión, año y tipo de documento.
4. Visualicen y descarguen los documentos encontrados.
5. Soliciten la creación o actualización de un documento cuando no esté disponible.
6. Consulten el estado y las respuestas de sus solicitudes.
7. Reciban notificaciones dentro de la aplicación y por correo electrónico.

También debe permitir que los agentes internos administren las solicitudes, respondan al cliente, cambien el estado y remitan una solicitud al equipo encargado de producir el documento.

TIPOS DE USUARIO

La aplicación tendrá dos perfiles:

1. Cliente

Puede buscar, visualizar y descargar documentos. También puede crear solicitudes y consultar su seguimiento.

2. Agente interno o administrador

Puede administrar documentos, revisar solicitudes, responder al cliente, actualizar estados, asignar responsables y enviar solicitudes a producción.

INICIO DE SESIÓN

Diseña una pantalla de inicio de sesión con:

* Correo electrónico.
* Contraseña.
* Botón “Iniciar sesión”.
* Opción “¿Olvidaste tu contraseña?”.
* Botón “Ingresar”.
* Logotipo de Siesa.
* Imagen o elemento visual relacionado con conocimiento, documentación y tecnología.

Utiliza usuarios de demostración para permitir la navegación por ambos perfiles:

* Cliente: [cliente@siesa.com](mailto:cliente@siesa.com)
* Agente interno: [agente@siesa.com](mailto:agente@siesa.com)

BASE DE DATOS DE USUARIOS

Cada usuario cliente debe tener la siguiente información:

* Nombre completo.
* Correo electrónico.
* Teléfono.
* Empresa.
* NIT.
* Cargo.
* Sistema asociado o sistema del cual solicita ayuda.
* Rol dentro de la aplicación.
* Fecha de registro.
* Estado del usuario: activo o inactivo.

Esta información debe utilizarse para personalizar la experiencia. Cuando el cliente cree una solicitud, sus datos personales y empresariales deben completarse automáticamente.

PANTALLA PRINCIPAL DEL CLIENTE

Diseña un dashboard con:

* Mensaje personalizado: “Hola, [nombre del cliente]”.
* Nombre de la empresa.
* Sistema asociado.
* Barra principal de búsqueda con el texto: “¿Qué documento necesitas consultar?”.
* Accesos rápidos a “Manuales”, “Comunicados” y “Mis solicitudes”.
* Documentos consultados recientemente.
* Documentos recomendados según el sistema del cliente.
* Últimos documentos publicados.
* Resumen de solicitudes por estado.

Incluye un menú lateral o superior con:

* Inicio.
* Biblioteca.
* Mis solicitudes.
* Notificaciones.
* Mi perfil.
* Cerrar sesión.

BIBLIOTECA DE DOCUMENTOS

Diseña una vista tipo catálogo documental.

Cada documento debe mostrar:

* Título.
* Descripción corta.
* Tipo: Manual o Comunicado.
* Sistema.
* Aplicativo.
* Versión.
* Año.
* Fecha de publicación.
* Fecha de actualización.
* Formato del archivo.
* Botón “Ver documento”.
* Botón “Descargar”.
* Etiqueta “Nuevo” o “Actualizado” cuando corresponda.

Incluye los siguientes filtros:

* Tipo de documento.
* Sistema.
* Aplicativo.
* Versión.
* Año.
* Orden por fecha o relevancia.

Los filtros deben poder combinarse. También debe existir una opción para limpiar todos los filtros.

La barra de búsqueda debe encontrar documentos por:

* Nombre.
* Descripción.
* Sistema.
* Aplicativo.
* Palabras clave.
* Contenido relacionado.

PANTALLA DE DETALLE DEL DOCUMENTO

Cuando el usuario seleccione un documento, debe visualizar:

* Título.
* Descripción.
* Vista previa.
* Tipo de documento.
* Sistema.
* Aplicativo.
* Versión.
* Año.
* Fecha de publicación.
* Última actualización.
* Botón “Descargar documento”.
* Botón “Compartir”.
* Documentos relacionados.
* Opción para indicar si el documento fue útil: “Sí” o “No”.

SOLICITUD DE DOCUMENTO

Cuando la búsqueda no genere resultados, mostrar el mensaje:

“No encontramos un documento que coincida con tu búsqueda. Puedes solicitar su creación o actualización.”

Agregar un botón destacado:

“Solicitar documento”

Al seleccionar esta opción, abrir un formulario con los siguientes campos:

DATOS DEL SOLICITANTE

Deben completarse automáticamente desde el perfil:

* Nombre.
* Correo electrónico.
* Teléfono.
* Empresa.
* NIT.
* Cargo.

DATOS DE LA SOLICITUD

* Tipo de documento: Manual o Comunicado.
* Tipo de solicitud: Documento nuevo, actualización o corrección.
* Sistema.
* Aplicativo.
* Versión.
* Año.
* Título sugerido.
* Descripción detallada de la necesidad.
* Motivo de la solicitud.
* Nivel de prioridad: baja, media o alta.
* Opción para adjuntar archivos o imágenes de referencia.
* Medio de notificación: aplicación, correo electrónico o ambos.
* Casilla de confirmación de la información.

Antes de enviar, mostrar un resumen de la solicitud.

Al enviarla:

* Generar automáticamente un número de solicitud.
* Registrar fecha y hora.
* Asignar el estado inicial “Recibida”.
* Mostrar una confirmación.
* Simular el envío de una notificación por correo electrónico.
* Agregar la solicitud al panel “Mis solicitudes”.

Utiliza un consecutivo como:

SOL-2026-0001

ESTADOS DE LAS SOLICITUDES

Las solicitudes deben manejar los siguientes estados:

1. Recibida.
2. En validación.
3. Información adicional requerida.
4. Aprobada.
5. En producción.
6. Documento disponible.
7. Rechazada.
8. Cerrada.

Cada estado debe identificarse mediante una etiqueta visual con color, manteniendo buena accesibilidad.

La solicitud debe guardar un historial completo de cambios, incluyendo:

* Estado anterior.
* Nuevo estado.
* Fecha y hora.
* Usuario responsable.
* Comentario asociado.

MIS SOLICITUDES

Diseña una pantalla para el cliente con:

* Número de solicitud.
* Título.
* Tipo de documento.
* Sistema.
* Aplicativo.
* Fecha de creación.
* Última actualización.
* Estado actual.
* Responsable, cuando aplique.
* Botón “Ver detalle”.

Incluye filtros por:

* Estado.
* Tipo de documento.
* Sistema.
* Fecha.
* Número de solicitud.

DETALLE DE LA SOLICITUD DEL CLIENTE

Debe mostrar:

* Número de solicitud.
* Información solicitada.
* Estado actual.
* Línea de tiempo del proceso.
* Fecha de creación.
* Fecha estimada de respuesta.
* Comentarios del agente.
* Archivos adjuntos.
* Campo para responder o enviar información adicional.
* Documento final, cuando esté disponible.

Cuando el documento sea publicado, mostrar el botón:

“Ver documento disponible”

PANEL DEL AGENTE INTERNO

Diseña un dashboard administrativo con:

* Total de solicitudes recibidas.
* Solicitudes pendientes.
* Solicitudes en validación.
* Solicitudes en producción.
* Solicitudes finalizadas.
* Solicitudes de alta prioridad.
* Solicitudes próximas a vencer.
* Tiempo promedio de atención.

Incluye una tabla principal con:

* Número de solicitud.
* Cliente.
* Empresa.
* NIT.
* Sistema.
* Aplicativo.
* Tipo de documento.
* Fecha de creación.
* Prioridad.
* Estado.
* Responsable.
* Acciones.

Incluye búsqueda y filtros avanzados por:

* Número de solicitud.
* Cliente.
* Empresa.
* NIT.
* Sistema.
* Aplicativo.
* Estado.
* Prioridad.
* Responsable.
* Rango de fechas.

GESTIÓN DE LA SOLICITUD POR EL AGENTE

El agente debe poder:

* Consultar toda la información del cliente.
* Revisar la descripción de la solicitud.
* Descargar los archivos adjuntos.
* Agregar comentarios internos.
* Responder al cliente.
* Solicitar información adicional.
* Cambiar el estado.
* Asignar un responsable.
* Definir una fecha estimada de respuesta.
* Aprobar o rechazar la solicitud.
* Enviar la solicitud a producción.
* Adjuntar el documento terminado.
* Vincular la solicitud con un documento existente.
* Marcar el documento como publicado.
* Cerrar la solicitud.

Cuando el agente seleccione “Enviar a producción”, solicitar:

* Responsable o equipo.
* Fecha esperada de entrega.
* Prioridad.
* Instrucciones para la construcción.
* Comentarios internos.

Los comentarios internos no deben ser visibles para el cliente. Las respuestas al cliente sí deben aparecer en su línea de tiempo.

ADMINISTRACIÓN DE DOCUMENTOS

Incluye una sección para que los administradores puedan:

* Crear un documento.
* Editar sus datos.
* Publicar una nueva versión.
* Desactivar un documento.
* Cargar un archivo.
* Cambiar el archivo asociado.
* Definir sistema, aplicativo, versión y año.
* Agregar descripción y palabras clave.
* Consultar historial de versiones.
* Relacionar documentos.
* Consultar número de visualizaciones y descargas.

NOTIFICACIONES

Diseña un centro de notificaciones dentro de la aplicación.

El cliente debe recibir notificaciones cuando:

* Se registre la solicitud.
* Cambie el estado.
* El agente solicite información adicional.
* El agente envíe una respuesta.
* El documento solicitado esté disponible.
* La solicitud sea cerrada o rechazada.

El agente debe recibir notificaciones cuando:

* Se registre una solicitud nueva.
* El cliente responda.
* Se acerque la fecha límite.
* Una solicitud permanezca sin gestión.
* Una solicitud sea marcada como prioritaria.

Simula las notificaciones por correo mediante mensajes visuales de confirmación. No es necesario realizar un envío real durante el prototipo.

REGLAS DE NEGOCIO

* Cada cliente solo puede visualizar sus propias solicitudes.
* Los documentos publicados pueden ser consultados por todos los clientes autorizados.
* Los agentes pueden consultar todas las solicitudes.
* Solo los agentes o administradores pueden modificar estados.
* Los clientes pueden responder, adjuntar información y cancelar una solicitud mientras no esté en producción.
* Si el estado es “Información adicional requerida”, la solicitud debe quedar pendiente de respuesta del cliente.
* Al publicar el documento solicitado, la solicitud debe cambiar a “Documento disponible”.
* Todas las acciones deben quedar registradas en el historial.
* El sistema debe solicitar confirmación antes de rechazar, cancelar o cerrar una solicitud.

DISEÑO VISUAL

Utiliza un diseño corporativo, limpio y tecnológico.

Características visuales:

* Fondo principalmente blanco.
* Azul oscuro como color principal.
* Azul claro para acciones secundarias.
* Verde para acciones exitosas.
* Amarillo o naranja para alertas.
* Rojo para solicitudes rechazadas o acciones críticas.
* Tarjetas con bordes suaves y sombras sutiles.
* Iconografía sencilla y moderna.
* Tipografía sans serif.
* Buen uso de espacios en blanco.
* Tablas fáciles de leer.
* Navegación clara.
* Diseño accesible y responsive.

Evita interfaces saturadas y textos demasiado pequeños.

RESPONSIVE

La aplicación debe adaptarse a:

* Computador de escritorio.
* Tableta.
* Teléfono móvil.

En dispositivos móviles, convierte el menú lateral en un menú desplegable y las tablas en tarjetas.

DATOS DE DEMOSTRACIÓN

Crea datos ficticios realistas para demostrar el funcionamiento:

* Al menos 10 documentos.
* Al menos 8 solicitudes en diferentes estados.
* Al menos 5 clientes.
* Al menos 3 agentes internos.
* Diferentes sistemas, aplicativos, versiones y años.

Incluye ejemplos como:

* Manual de configuración de nómina.
* Manual de facturación electrónica.
* Manual de cierre contable.
* Comunicado de actualización tributaria.
* Comunicado de mantenimiento programado.
* Guía de configuración de usuarios.

INTERACCIONES DEL PROTOTIPO

Construye un prototipo navegable y funcional que permita demostrar, como mínimo, los siguientes flujos:

Flujo 1: el cliente inicia sesión, busca un documento, aplica filtros, abre el detalle y lo descarga.

Flujo 2: el cliente busca un documento que no existe, crea una solicitud y consulta su estado.

Flujo 3: el agente inicia sesión, abre una solicitud, responde al cliente y solicita información adicional.

Flujo 4: el agente aprueba una solicitud, la envía a producción y asigna un responsable.

Flujo 5: el agente carga el documento terminado, lo publica y cambia la solicitud a “Documento disponible”.

Flujo 6: el cliente recibe la notificación, consulta el documento y cierra la solicitud.

REQUERIMIENTOS TÉCNICOS PARA EL PROTOTIPO

* Crear todos los componentes necesarios para navegar entre pantallas.
* Utilizar componentes reutilizables.
* Incluir estados vacíos, carga, error y confirmación.
* Incluir validaciones en los formularios.
* Utilizar datos simulados para demostrar el funcionamiento.
* Mantener temporalmente los datos en el estado de la aplicación o almacenamiento local.
* Dejar la estructura preparada para conectar posteriormente una base de datos y un servicio de correo electrónico.
* No depender de integraciones externas para demostrar el prototipo inicial.

Genera primero la aplicación completa y funcional. Prioriza la experiencia de búsqueda documental, la solicitud de documentos y la trazabilidad de los estados.
