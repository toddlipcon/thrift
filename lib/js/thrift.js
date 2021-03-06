/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var Thrift = {

    Type : {
        "STOP"   : 0,
        "VOID"   : 1,
        "BOOL"   : 2,
        "BYTE"   : 3,
        "I08"    : 3,
        "DOUBLE" : 4,
        "I16"    : 6,
        "I32"    : 8,
        "I64"    : 10,
        "STRING" : 11,
        "UTF7"   : 11,
        "STRUCT" : 12,
        "MAP"    : 13,
        "SET"    : 14,
        "LIST"   : 15,
        "UTF8"   : 16,
        "UTF16"  : 17
    },

    MessageType : {
        "CALL"      : 1,
        "REPLY"     : 2,
        "EXCEPTION" : 3
    }
}

Thrift.TException = {}
Thrift.TException.prototype = { 
    initialize: function( message, code ) {
            this.message = message;
            this.code    = (code == null) ? 0 : code;
    }
}


Thrift.TApplicationExceptionType = {
    "UNKNOWN"              : 0,
    "UNKNOWN_METHOD"       : 1,
    "INVALID_MESSAGE_TYPE" : 2,
    "WRONG_METHOD_NAME"    : 3,
    "BAD_SEQUENCE_ID"      : 4,
    "MISSING_RESULT"       : 5       
}

Thrift.TApplicationException = function(message, code){
    this.message = message
    this.code    = (code == null) ? 0 : code
}

Thrift.TApplicationException.prototype = { 
       
    read : function(input){
        
        var ftype
        var fid
        var ret = input.readStructBegin(fname) 
        
        this.fname = ret.fname      
        
        while(1){
            
            ret = input.readFieldBegin()
            
            if(ret.ftype == TType.STOP)
                break
            
            var fid = ret.fid
            
            switch(fid){
                case 1: 
                    if( ret.ftype == Type.STRING ){
                        ret = input.readString()
                        this.message = ret.value
                    } else {
                        ret = input.skip(ret.ftype)
                    }
                    
                    break
                case 2:
                    if( ret.ftype == Type.I32 ){
                        ret = input.readI32()
                        this.code = ret.value
                    } else {
                        ret   = input.skip(ret.ftype)
                    }
                    break
                    
                default:
                    ret = input.skip(ret.ftype)
                    break
            }
            
            input.readFieldEnd()
            
        }
        
        input.readStructEnd()
        
    },
    
    write: function(output){
        var xfer   = 0;
        
        output.writeStructBegin('TApplicationException');
        
        if (this.message) {
            output.writeFieldBegin('message', Type.STRING, 1)
            output.writeString(this.getMessage())
            output.writeFieldEnd()
        }
        
        if (this.code) {
            output.writeFieldBegin('type', Type.I32, 2)
            output.writeI32(this.code)
            output.writeFieldEnd()
        }
        
        output.writeFieldStop()
        output.writeStructEnd()
       
    },
    
    getCode : function() {
        return this.code
    },
    
    getMessage : function() {
        return this.message
    }
}



/**
 *If you do not specify a url then you must handle ajax on your own.
 *This is how to use js bindings in a async fashion.
 */
Thrift.Transport = function(url){
    this.url      = url
    this.wpos     = 0
    this.rpos     = 0

    this.send_buf = ''
    this.recv_buf = ''
}

Thrift.Transport.prototype = {

    //Gets the browser specific XmlHttpRequest Object
    getXmlHttpRequestObject : function() {
	
        try { return new XMLHttpRequest() } catch(e) {}
        try { return new ActiveXObject("Msxml2.XMLHTTP") } catch (e) {}
        try { return new ActiveXObject("Microsoft.XMLHTTP") } catch (e) {}

        throw "Your browser doesn't support the XmlHttpRequest object.  Try upgrading to Firefox."
	
    },

    flush : function(){

        //async mode
        if(this.url == undefined || this.url == '')
            return this.send_buf;

        var xreq = this.getXmlHttpRequestObject()
        		
        if (xreq.overrideMimeType)
            xreq.overrideMimeType("application/json")
        
        xreq.open("POST", this.url, false)
        xreq.send(this.send_buf)
        
        if (xreq.readyState != 4)
            throw "encountered an unknown ajax ready state: "+xreq.readyState
        
        if (xreq.status != 200)
            throw "encountered a unknown request status: "+xreq.status

        this.recv_buf    = xreq.responseText
        this.recv_buf_sz = this.recv_buf.length
        this.wpos        = this.recv_buf.length
        this.rpos        = 0
    },

    setRecvBuffer : function(buf){
        this.recv_buf    = buf
        this.recv_buf_sz = this.recv_buf.length
        this.wpos        = this.recv_buf.length
        this.rpos        = 0
    },

    isOpen : function() {
        return true
    },

    open : function() {},

    close: function() {},

    read : function(len) {
        var avail = this.wpos - this.rpos
       
        if(avail == 0)
            return ''

        var give = len

        if(avail < len)
            give = avail

        var ret = this.read_buf.substr(this.rpos,give)
        this.rpos += give

        //clear buf when complete?
        return ret
    },

    readAll : function() {
       return this.recv_buf
    },

    write : function(buf){
        this.send_buf = buf
    },

    getSendBuffer : function(){
        return this.send_buf
    }

}



Thrift.Protocol = function(transport){
    this.transport = transport
}

Thrift.Protocol.Type = {}
Thrift.Protocol.Type[ Thrift.Type.BOOL   ] = '"tf"'
Thrift.Protocol.Type[ Thrift.Type.BYTE   ] = '"i8"'
Thrift.Protocol.Type[ Thrift.Type.I16    ] = '"i16"'
Thrift.Protocol.Type[ Thrift.Type.I32    ] = '"i32"'
Thrift.Protocol.Type[ Thrift.Type.I64    ] = '"i64"'
Thrift.Protocol.Type[ Thrift.Type.DOUBLE ] = '"dbl"'
Thrift.Protocol.Type[ Thrift.Type.STRUCT ] = '"rec"'
Thrift.Protocol.Type[ Thrift.Type.STRING ] = '"str"'
Thrift.Protocol.Type[ Thrift.Type.MAP    ] = '"map"'
Thrift.Protocol.Type[ Thrift.Type.LIST   ] = '"lst"'
Thrift.Protocol.Type[ Thrift.Type.SET    ] = '"set"'


Thrift.Protocol.RType = {}
Thrift.Protocol.RType[ "tf" ] = Thrift.Type.BOOL
Thrift.Protocol.RType[ "i8" ] = Thrift.Type.BYTE
Thrift.Protocol.RType[ "i16"] = Thrift.Type.I16
Thrift.Protocol.RType[ "i32"] = Thrift.Type.I32
Thrift.Protocol.RType[ "i64"] = Thrift.Type.I64 
Thrift.Protocol.RType[ "dbl"] = Thrift.Type.DOUBLE 
Thrift.Protocol.RType[ "rec"] = Thrift.Type.STRUCT 
Thrift.Protocol.RType[ "str"] = Thrift.Type.STRING
Thrift.Protocol.RType[ "map"] = Thrift.Type.MAP 
Thrift.Protocol.RType[ "lst"] = Thrift.Type.LIST
Thrift.Protocol.RType[ "set"] = Thrift.Type.SET 

Thrift.Protocol.Version = 1

Thrift.Protocol.prototype = {
    
    getTransport : function(){
        return this.transport
    },

    //Write functions
    writeMessageBegin : function(name,messageType,seqid){
        this.tstack = new Array()
        this.tpos   = new Array();
           
        this.tstack.push([Thrift.Protocol.Version,'"'+name+'"',messageType,seqid]);
    },

    writeMessageEnd : function(){
        var obj = this.tstack.pop()
        
        this.wobj = this.tstack.pop()
        this.wobj.push(obj)
 
        this.wbuf = "["+this.wobj.join(",")+"]";

        this.transport.write(this.wbuf);       
     },


    writeStructBegin : function(name){
        this.tpos.push(this.tstack.length)
        this.tstack.push({})
    },

    writeStructEnd : function(){
        
        var p = this.tpos.pop()
        var struct = this.tstack[p]
        var str = "{"
        var first = true
        for( var key in struct ){
            if(first) 
                first = false;
            else
                str += ",";

            str += key+":"+struct[key]
        } 

        str += "}"
        this.tstack[p] = str;
    },

    writeFieldBegin : function(name,fieldType,fieldId){
        this.tpos.push(this.tstack.length)
        this.tstack.push({"fieldId" : '"'+fieldId+'"', "fieldType" : Thrift.Protocol.Type[fieldType]});
       
    },

    writeFieldEnd : function(){
        var value     = this.tstack.pop()
        var fieldInfo = this.tstack.pop() 
        
        this.tstack[this.tstack.length-1][fieldInfo.fieldId] = "{"+fieldInfo.fieldType+":"+value+"}" 
        this.tpos.pop()
    },

    writeFieldStop : function(){
        //na
    },

    writeMapBegin : function(keyType,valType,size){
        //size is invalid, we'll set it on end.
        this.tpos.push(this.tstack.length)
        this.tstack.push([Thrift.Protocol.Type[keyType],Thrift.Protocol.Type[valType],0]) 
    },

    writeMapEnd : function(){
        var p   = this.tpos.pop()
        
        if(p == this.tstack.length)
            return;
        
        if((this.tstack.length - p - 1) % 2 != 0)
            this.tstack.push("");

        var size = (this.tstack.length - p - 1)/2

        this.tstack[p][this.tstack[p].length-1] = size;
        
        var map   = "{"
        var first = true
        while( this.tstack.length > p+1 ){
            var v = this.tstack.pop()
            var k = this.tstack.pop()
            if(first){
                first = false
            }else{
                map += ","
            }
            
            map  += '"'+k+'":'+v
        }
        map += "}"
        
        this.tstack[p].push(map)
        this.tstack[p] = "["+this.tstack[p].join(",")+"]"
    },

    writeListBegin : function(elemType,size){
        this.tpos.push(this.tstack.length)
        this.tstack.push([Thrift.Protocol.Type[elemType],size]);
    },

    writeListEnd : function(){
        var p = this.tpos.pop()

        while( this.tstack.length > p+1 ){
            var tmpVal = this.tstack[p+1]
            this.tstack.splice(p+1, 1)
            this.tstack[p].push(tmpVal)
        }

        this.tstack[p] = '['+this.tstack[p].join(",")+']';
    },

    writeSetBegin : function(elemType,size){
        this.tpos.push(this.tstack.length)
        this.tstack.push([Thrift.Protocol.Type[elemType],size]);
    },

    writeSetEnd : function(){
        var p = this.tpos.pop()

        while( this.tstack.length > p+1 ){
            var tmpVal = this.tstack[p+1]
            this.tstack.splice(p+1, 1)
            this.tstack[p].push(tmpVal)
        }

        this.tstack[p] = '['+this.tstack[p].join(",")+']';
    },

    writeBool : function(value){
        this.tstack.push( value ? 1 : 0 );
    },

    writeByte : function(i8){
        this.tstack.push(i8);
    },

    writeI16 : function(i16){
        this.tstack.push(i16);
    },

    writeI32 : function(i32){
        this.tstack.push(i32);
    },

    writeI64 : function(i64){
        this.tstack.push(i64);
    },

    writeDouble : function(dbl){
        this.tstack.push(dbl);
    },

    writeString : function(str){
        this.tstack.push('"'+encodeURIComponent(str)+'"');
    },

    writeBinary : function(str){
        this.writeString(str);
    },


    
    // Reading functions
    readMessageBegin : function(name, messageType, seqid){
        this.rstack = new Array()
        this.rpos   = new Array()
       
        this.robj = eval(this.transport.readAll())
        
        var r = {}     
        var version = this.robj.shift()
        
        if(version != Thrift.Protocol.Version){
            throw "Wrong thrift protocol version: "+version
        }

        r["fname"]  = this.robj.shift()
        r["mtype"]  = this.robj.shift()
        r["rseqid"] = this.robj.shift()
        
        
        //get to the main obj
        this.rstack.push(this.robj.shift())
      
        return r
    },

  
    readMessageEnd : function(){
    },

    readStructBegin : function(name){
        var r = {}
        r["fname"] = ''
        
        //incase this is an array of structs
        if(this.rstack[this.rstack.length-1] instanceof Array)
            this.rstack.push(this.rstack[this.rstack.length-1].shift())
     
        return r
    },

    readStructEnd : function(){
        if(this.rstack[this.rstack.length-2] instanceof Array)
            this.rstack.pop()
    },

    readFieldBegin : function(){
        var r = {};
        
        var fid   = -1
        var ftype = Thrift.Type.STOP 
        
        //get a fieldId
        for(var f in (this.rstack[this.rstack.length-1])){
            if(f == null) continue
            
            fid = parseInt(f)
            this.rpos.push(this.rstack.length)
            
            var field = this.rstack[this.rstack.length-1][fid]
           
            //remove so we don't see it again
            delete this.rstack[this.rstack.length-1][fid]
            
            this.rstack.push(field)            
            
            break
        }
            
        if(fid != -1){      
       
            //should only be 1 of these but this is the only
            //way to match a key
            for(var f in (this.rstack[this.rstack.length-1])){
                if(Thrift.Protocol.RType[f] == null ) continue
                
                ftype = Thrift.Protocol.RType[f]
                this.rstack[this.rstack.length-1] = this.rstack[this.rstack.length-1][f]
            }        
        }
        
        r["fname"] = ''
        r["ftype"] = ftype
        r["fid"]   = fid
        

        return r
    },

    readFieldEnd : function(){  
        var pos = this.rpos.pop()
        
        //get back to the right place in the stack
        while(this.rstack.length > pos)
            this.rstack.pop();
                 
    },

    readMapBegin : function(keyType,valType,size){
        
        var map = this.rstack.pop()
        
        var r = {};
        r["ktype"] = Thrift.Protocol.RType[map.shift()]
        r["vtype"] = Thrift.Protocol.RType[map.shift()]
        r["size"]  = map.shift()
        
        
        this.rpos.push(this.rstack.length)
        this.rstack.push(map.shift())
        
        return r;
    },

    readMapEnd : function(){
        this.readFieldEnd()
    },

    readListBegin : function(elemType,size){
      
        var list = this.rstack[this.rstack.length-1]
      
        var r = {};
        r["etype"] = Thrift.Protocol.RType[list.shift()];
        r["size" ] = list.shift();
        
        
        this.rpos.push(this.rstack.length);
        this.rstack.push(list)
             
        return r;
    },

    readListEnd : function(){
        this.readFieldEnd()
    },

    readSetBegin : function(elemType,size){
        return this.readListBegin(elemType,size)
    },

    readSetEnd : function(){
        return this.readListEnd()
    },

    readBool : function(){
        var r = this.readI32()
    
        if( r != null && r["value"] == "1" ){
            r["value"] = true
        }else{
            r["value"] = false
        }
        
        return r
    },

    readByte : function(){
        return this.readI32()
    },

    readI16 : function(){
        return this.readI32()
    },
   

    readI32 : function(f){
        if(f == undefined)
            f = this.rstack[this.rstack.length-1]
        
        var r = {}    
            
        if(f instanceof Array){
            if(f.length == 0)
                r["value"] = undefined
            else
                r["value"] = f.shift()

        }else if(f instanceof Object){
           for(var i in f){
                if(i == null) continue
                this.rstack.push(f[i])
                delete f[i]  
                                  
                r["value"] = i
                break
           }
        } else {
            r["value"] = f
        }
        
        return r
    },

    readI64 : function(){
        return this.readI32()
    },

    readDouble : function(){
        return this.readI32()
    },

    readString : function(){
        var r = this.readI32()
        r["value"] = decodeURIComponent(r["value"])
        
        return r
    },

    readBinary : function(){
        return this.readString()
    },

    
    //Method to arbitrarily skip over data.
    skip : function(type){
        throw "skip not supported yet"
    }
   
}



